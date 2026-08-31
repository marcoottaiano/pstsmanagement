import { createClient } from "@/lib/supabase/server";

import { scheduledWorkDatabaseSchema, scheduledWorkGroupRowSchema } from "./scheduled-work.schemas";
import type {
  ScheduledWork,
  ScheduledWorkCalendarItem,
  ScheduledWorkGroup,
} from "./scheduled-work.types";
import { toCalendarItem } from "./scheduled-work.mapper";

const scheduledWorkColumns =
  "id, sector_id, title, description, start_at, end_at, all_day, created_by, created_at, updated_at";

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
): Promise<readonly ScheduledWorkCalendarItem[]> {
  if (groupIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scheduled_work")
    .select(scheduledWorkColumns)
    .eq("sector_id", sectorId)
    .lt("start_at", rangeEndAt)
    .or(`end_at.is.null,end_at.gt.${rangeStartAt}`)
    .order("start_at");

  if (error) {
    console.error("Scheduled work query failed.", { code: error.code, message: error.message });
    throw new Error("Impossibile caricare i lavori programmati.");
  }

  const works = parseScheduledWork(data);
  if (works.length === 0) {
    return [];
  }

  const { data: groupRows, error: groupError } = await supabase
    .from("scheduled_work_groups")
    .select("scheduled_work_id, group_id, group_nodes(name, is_archived)")
    .in(
      "scheduled_work_id",
      works.map((work) => work.id),
    );

  if (groupError) {
    console.error("Scheduled work groups query failed.", {
      code: groupError.code,
      message: groupError.message,
    });
    throw new Error("Impossibile caricare i gruppi dei lavori programmati.");
  }

  const parsedGroups = scheduledWorkGroupRowSchema.array().safeParse(groupRows);
  if (!parsedGroups.success) {
    console.error("Scheduled work groups response failed validation.", {
      issues: parsedGroups.error.issues,
    });
    throw new Error("I gruppi dei lavori programmati restituiti dal database non sono validi.");
  }

  const groupsByWork = new Map<string, ScheduledWorkGroup[]>();
  for (const row of parsedGroups.data) {
    const groups = groupsByWork.get(row.scheduled_work_id) ?? [];
    groups.push({
      id: row.group_id,
      name: row.group_nodes.name,
      isArchived: row.group_nodes.is_archived,
    });
    groupsByWork.set(row.scheduled_work_id, groups);
  }

  const visibleGroupIds = new Set(groupIds);
  return works.flatMap((work) => {
    const groups = (groupsByWork.get(work.id) ?? []).toSorted((left, right) =>
      left.name.localeCompare(right.name, "it"),
    );
    return groups.some((group) => visibleGroupIds.has(group.id))
      ? [toCalendarItem(work, groups)]
      : [];
  });
}
