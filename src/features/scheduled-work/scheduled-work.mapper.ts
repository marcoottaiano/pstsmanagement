import { storedDateTimeToCalendarValue, storedDateToRomeDate } from "./scheduled-work.dates";
import type {
  ScheduledWork,
  ScheduledWorkCalendarItem,
  ScheduledWorkEventInput,
  ScheduledWorkGroup,
} from "./scheduled-work.types";

const EVENT_COLORS = ["#2471d5", "#2b8a3e", "#9c36b5", "#e8590c", "#0b7285", "#c2255c"] as const;

function getGroupColor(groups: readonly ScheduledWorkGroup[]): string {
  const stableGroupKey = groups
    .map((group) => group.id)
    .toSorted()
    .join(":");
  const hash = [...stableGroupKey].reduce((total, character) => total + character.charCodeAt(0), 0);
  return EVENT_COLORS[hash % EVENT_COLORS.length] ?? EVENT_COLORS[0];
}

export function getScheduledWorkGroupNames(groups: readonly ScheduledWorkGroup[]): string {
  return groups.map((group) => group.name).join(" · ");
}

export function toCalendarItem(
  work: ScheduledWork,
  groups: readonly ScheduledWorkGroup[],
): ScheduledWorkCalendarItem {
  return { ...work, itemType: "scheduledWork", groups };
}

export function toScheduledWorkEvent(item: ScheduledWorkCalendarItem): ScheduledWorkEventInput {
  const color = getGroupColor(item.groups);

  return {
    id: `scheduledWork:${item.id}`,
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
      itemId: item.id,
      itemType: "scheduledWork",
      sectorId: item.sectorId,
      groupIds: item.groups.map((group) => group.id),
      groupName: getScheduledWorkGroupNames(item.groups),
      description: item.description,
    },
  };
}
