import type { EventInput } from "@fullcalendar/core";

import { reminderDueToCalendarValue } from "./reminders.dates";
import type { Reminder, ReminderCalendarItem, ReminderPriority } from "./reminders.types";

const PRIORITY_COLORS: Record<ReminderPriority, string> = {
  HIGH: "#e03131",
  NORMAL: "#e8590c",
  LOW: "#0b7285",
};

export function toReminderCalendarItem(reminder: Reminder): ReminderCalendarItem {
  return { ...reminder, itemType: "reminder" };
}

export function toReminderEvent(item: ReminderCalendarItem): EventInput {
  const completed = item.status === "COMPLETED";
  const color = completed ? "#868e96" : PRIORITY_COLORS[item.priority];

  return {
    id: `reminder:${item.id}`,
    title: item.title,
    start: item.dueAt ? reminderDueToCalendarValue(item.dueAt, item.dueAllDay) : undefined,
    allDay: item.dueAllDay,
    editable: !completed,
    startEditable: !completed,
    durationEditable: false,
    backgroundColor: color,
    borderColor: color,
    classNames: completed ? ["reminder-calendar-event-completed"] : ["reminder-calendar-event"],
    extendedProps: {
      itemId: item.id,
      itemType: "reminder",
      sectorId: item.sectorId,
      groupId: item.groupId,
      groupName: item.groupName ?? "Personale",
      priority: item.priority,
      status: item.status,
    },
  };
}
