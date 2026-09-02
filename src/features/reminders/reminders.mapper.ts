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

export function getReminderGroupNames(reminder: Reminder): string {
  return reminder.groups.length > 0
    ? reminder.groups.map((group) => group.name).join(" · ")
    : "Personale";
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
      groupIds: item.groups.map((group) => group.id),
      groupName: getReminderGroupNames(item),
      priority: item.priority,
      status: item.status,
    },
  };
}
