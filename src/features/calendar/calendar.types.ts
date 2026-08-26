import type { ReminderCalendarItem } from "@/features/reminders/reminders.types";
import type { ScheduledWorkCalendarItem } from "@/features/scheduled-work/scheduled-work.types";

export type CalendarItem = ScheduledWorkCalendarItem | ReminderCalendarItem;
