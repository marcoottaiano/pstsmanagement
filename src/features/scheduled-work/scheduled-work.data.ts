import { createClient } from "@/lib/supabase/server";

import { scheduledWorkDatabaseSchema } from "./scheduled-work.schemas";
import type { CalendarItem, ScheduledWork } from "./scheduled-work.types";
import { toCalendarItem } from "./scheduled-work.mapper";

const scheduledWorkColumns =
  "id, sector_id, group_id, title, description, start_at, end_at, all_day, created_by, created_at, updated_at";

function parseScheduledWork(data: unknown): readonly ScheduledWork[] {
  const parsed = scheduledWorkDatabaseSchema.array().safeParse(data);

  if (!parsed.success) {
    console.error("Scheduled work response failed validation.", { issues: parsed.error.issues });
    throw new Error("I lavori programmati restituiti dal database non sono validi.");
  }

  return parsed.data;
}

export async function getScheduledWorkForVisibleRange(
  sectorId: string,
  groupIds: readonly string[],
  rangeStartAt: string,
  rangeEndAt: string,
  groupNames: ReadonlyMap<string, string>,
): Promise<readonly CalendarItem[]> {
  if (groupIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scheduled_work")
    .select(scheduledWorkColumns)
    .eq("sector_id", sectorId)
    .in("group_id", [...groupIds])
    .lt("start_at", rangeEndAt)
    .or(`end_at.is.null,end_at.gt.${rangeStartAt}`)
    .order("start_at");

  if (error) {
    console.error("Scheduled work query failed.", { code: error.code, message: error.message });
    throw new Error("Impossibile caricare i lavori programmati.");
  }

  return parseScheduledWork(data).map((work) =>
    toCalendarItem(work, groupNames.get(work.groupId) ?? "Gruppo"),
  );
}
