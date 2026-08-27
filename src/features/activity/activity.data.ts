import { getAuthenticatedContext } from "@/features/auth/auth.data";
import { createClient } from "@/lib/supabase/server";

import { getActivityPeriodStart } from "./activity.dates";
import {
  activityActorOptionSchema,
  activityLogFiltersSchema,
  activityLogRowSchema,
  activitySectorOptionSchema,
} from "./activity.schemas";
import type { ActivityLogFilters, ActivityLogPageData } from "./activity.types";

const ACTIVITIES_PER_PAGE = 25;

type ActivitySearchParams = Readonly<Record<string, string | string[] | undefined>>;

export function parseActivityLogFilters(searchParams: ActivitySearchParams): ActivityLogFilters {
  const parsed = activityLogFiltersSchema.parse(searchParams);
  return {
    actorId: parsed.actor,
    entityType: parsed.entity,
    sectorId: parsed.sector,
    period: parsed.period,
    page: parsed.page,
  };
}

export async function getActivityLogPageData(
  filters: ActivityLogFilters,
): Promise<ActivityLogPageData> {
  const context = await getAuthenticatedContext();
  if (!context?.isAdmin) {
    throw new Error("Accesso amministrativo richiesto.");
  }

  const supabase = await createClient();
  const firstRow = (filters.page - 1) * ACTIVITIES_PER_PAGE;
  const lastRow = firstRow + ACTIVITIES_PER_PAGE - 1;
  const periodStart = getActivityPeriodStart(filters.period);

  let activityQuery = supabase
    .from("activity_log")
    .select(
      "id, actor_id, actor_name, actor_email, action, entity_type, entity_id, entity_title, sector_id, metadata, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(firstRow, lastRow);

  if (filters.actorId) {
    activityQuery = activityQuery.eq("actor_id", filters.actorId);
  }
  if (filters.entityType) {
    activityQuery = activityQuery.eq("entity_type", filters.entityType);
  }
  if (filters.sectorId) {
    activityQuery = activityQuery.eq("sector_id", filters.sectorId);
  }
  if (periodStart) {
    activityQuery = activityQuery.gte("created_at", periodStart);
  }

  const [activityResult, actorsResult, sectorsResult] = await Promise.all([
    activityQuery,
    supabase.from("profiles").select("id, display_name, email").order("display_name"),
    supabase.from("sectors").select("id, name").order("name"),
  ]);

  const queryError = activityResult.error ?? actorsResult.error ?? sectorsResult.error;
  if (queryError) {
    console.error("Activity log query failed.", {
      code: queryError.code,
      message: queryError.message,
    });
    throw new Error("Non è stato possibile caricare il registro attività.");
  }

  const items = activityLogRowSchema.array().safeParse(activityResult.data);
  const actors = activityActorOptionSchema.array().safeParse(actorsResult.data);
  const sectors = activitySectorOptionSchema.array().safeParse(sectorsResult.data);
  if (!items.success || !actors.success || !sectors.success) {
    console.error("Activity log response failed validation.", {
      activityIssues: items.error?.issues,
      actorIssues: actors.error?.issues,
      sectorIssues: sectors.error?.issues,
    });
    throw new Error("I dati del registro attività non sono validi.");
  }

  const totalItems = activityResult.count ?? 0;
  return {
    items: items.data,
    actors: actors.data.map((actor) => ({
      value: actor.id,
      label: actor.email ? `${actor.display_name} · ${actor.email}` : actor.display_name,
    })),
    sectors: sectors.data.map((sector) => ({ value: sector.id, label: sector.name })),
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / ACTIVITIES_PER_PAGE)),
  };
}
