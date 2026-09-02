import type { Sector } from "@/features/auth/auth.types";
import type { GroupNode } from "@/features/groups/groups.types";
import { getObjectivesForScope } from "@/features/objectives/objectives.data";
import {
  getReminderAssigneeOptions,
  getVisibleReminders,
} from "@/features/reminders/reminders.data";
import { getScheduledWorkForVisibleRange } from "@/features/scheduled-work/scheduled-work.data";
import { getVisibleMonthRange } from "@/features/scheduled-work/scheduled-work.dates";

export async function getDashboardData(
  sector: Sector,
  nodes: readonly GroupNode[],
  calendarDate: string,
) {
  const selectableGroups: readonly GroupNode[] = nodes;
  const groupIds = selectableGroups.map((group) => group.id);
  const groupNames = new Map(selectableGroups.map((group) => [group.id, group.name]));
  const range = getVisibleMonthRange(calendarDate);
  const [scheduledWork, reminders, assigneeOptions, objectives] = await Promise.all([
    getScheduledWorkForVisibleRange(sector.id, groupIds, range.startAt, range.endAt),
    getVisibleReminders(sector.id, null),
    getReminderAssigneeOptions(sector.id),
    getObjectivesForScope(sector.id, groupIds, groupNames),
  ]);

  return {
    selectableGroups,
    scheduledWork,
    reminders,
    assigneeOptions,
    objectives,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
