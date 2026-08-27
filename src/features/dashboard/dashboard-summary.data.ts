import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import type { Objective } from "@/features/objectives/objectives.types";
import { getRomeDayKey } from "@/features/reminders/reminders.dates";
import type { Reminder } from "@/features/reminders/reminders.types";
import type { ScheduledWorkCalendarItem } from "@/features/scheduled-work/scheduled-work.types";

import type { DashboardSummaryData, GroupWorkload } from "./dashboard-summary.types";

dayjs.extend(utc);
dayjs.extend(timezone);

const ROME_TIME_ZONE = "Europe/Rome";

function isWithinNextWeek(startAt: string, now: dayjs.Dayjs): boolean {
  const start = dayjs(startAt);
  return !start.isBefore(now) && start.isBefore(now.add(7, "day"));
}

function getGroupWorkloads(
  scheduledWork: readonly ScheduledWorkCalendarItem[],
  reminders: readonly Reminder[],
): readonly GroupWorkload[] {
  const workloads = new Map<string, GroupWorkload>();

  for (const work of scheduledWork) {
    const current = workloads.get(work.groupId) ?? {
      groupId: work.groupId,
      groupName: work.groupName,
      scheduledWorkCount: 0,
      openReminderCount: 0,
    };
    workloads.set(work.groupId, { ...current, scheduledWorkCount: current.scheduledWorkCount + 1 });
  }

  for (const reminder of reminders) {
    if (reminder.status !== "OPEN" || !reminder.groupId) {
      continue;
    }
    const current = workloads.get(reminder.groupId) ?? {
      groupId: reminder.groupId,
      groupName: reminder.groupName ?? "Gruppo non disponibile",
      scheduledWorkCount: 0,
      openReminderCount: 0,
    };
    workloads.set(reminder.groupId, {
      ...current,
      openReminderCount: current.openReminderCount + 1,
    });
  }

  return [...workloads.values()].sort(
    (left, right) =>
      right.scheduledWorkCount +
        right.openReminderCount -
        (left.scheduledWorkCount + left.openReminderCount) ||
      left.groupName.localeCompare(right.groupName),
  );
}

export function getDashboardSummary(
  upcomingWork: readonly ScheduledWorkCalendarItem[],
  scheduledWorkForCalendar: readonly ScheduledWorkCalendarItem[],
  reminders: readonly Reminder[],
  objectives: readonly Objective[],
): DashboardSummaryData {
  const now = dayjs().tz(ROME_TIME_ZONE);
  const today = getRomeDayKey();

  return {
    imminentWorkCount: upcomingWork.filter((work) => isWithinNextWeek(work.startAt, now)).length,
    overdueReminderCount: reminders.filter(
      (reminder) =>
        reminder.status === "OPEN" &&
        reminder.dueAt !== null &&
        (reminder.dueAllDay
          ? getRomeDayKey(reminder.dueAt) < today
          : dayjs(reminder.dueAt).isBefore(now)),
    ).length,
    completedObjectiveCount: objectives.filter((objective) => objective.status === "COMPLETED")
      .length,
    totalObjectiveCount: objectives.length,
    lateObjectiveCount: objectives.filter(
      (objective) =>
        objective.periodEnd !== null &&
        objective.periodEnd < today &&
        objective.status !== "COMPLETED" &&
        objective.status !== "POSTPONED",
    ).length,
    groupWorkloads: getGroupWorkloads(scheduledWorkForCalendar, reminders),
  };
}
