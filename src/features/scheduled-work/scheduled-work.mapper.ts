import { storedDateTimeToCalendarValue, storedDateToRomeDate } from "./scheduled-work.dates";
import type { CalendarItem, ScheduledWork, ScheduledWorkEventInput } from "./scheduled-work.types";

const EVENT_COLORS = ["#2471d5", "#2b8a3e", "#9c36b5", "#e8590c", "#0b7285", "#c2255c"] as const;

function getGroupColor(groupId: string): string {
  const hash = [...groupId].reduce((total, character) => total + character.charCodeAt(0), 0);
  return EVENT_COLORS[hash % EVENT_COLORS.length] ?? EVENT_COLORS[0];
}

export function toCalendarItem(work: ScheduledWork, groupName: string): CalendarItem {
  return { ...work, groupName };
}

export function toFullCalendarEvent(item: CalendarItem): ScheduledWorkEventInput {
  const color = getGroupColor(item.groupId);

  return {
    id: item.id,
    title: item.title,
    start: item.allDay
      ? storedDateToRomeDate(item.startAt)
      : storedDateTimeToCalendarValue(item.startAt),
    end: item.endAt
      ? item.allDay
        ? storedDateToRomeDate(item.endAt)
        : storedDateTimeToCalendarValue(item.endAt)
      : undefined,
    allDay: item.allDay,
    editable: true,
    durationEditable: item.endAt !== null,
    backgroundColor: color,
    borderColor: color,
    extendedProps: {
      sectorId: item.sectorId,
      groupId: item.groupId,
      groupName: item.groupName,
      description: item.description,
    },
  };
}
