import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

const ROME_TIME_ZONE = "Europe/Rome";
const DATE_TIME_FORMAT = "YYYY-MM-DDTHH:mm";

export function reminderDueToIso(date: string, time: string): string | null {
  const localValue = `${date}T${time || "00:00"}`;
  const parsed = dayjs.tz(localValue, DATE_TIME_FORMAT, ROME_TIME_ZONE);

  if (!parsed.isValid() || parsed.format(DATE_TIME_FORMAT) !== localValue) {
    return null;
  }

  return parsed.toISOString();
}

export function reminderDueToFormParts(value: string): Readonly<{ date: string; time: string }> {
  const due = dayjs.utc(value).tz(ROME_TIME_ZONE);
  return { date: due.format("YYYY-MM-DD"), time: due.format("HH:mm") };
}

export function reminderDueToCalendarValue(value: string, allDay: boolean): string {
  const due = dayjs.utc(value).tz(ROME_TIME_ZONE);
  return due.format(allDay ? "YYYY-MM-DD" : "YYYY-MM-DDTHH:mm:ss");
}

export function formatReminderDue(value: string, allDay: boolean): string {
  const due = dayjs.utc(value).tz(ROME_TIME_ZONE);
  return due.format(allDay ? "DD/MM/YYYY" : "DD/MM/YYYY [alle] HH:mm");
}

export function getRomeDayKey(value?: string): string {
  return value
    ? dayjs.utc(value).tz(ROME_TIME_ZONE).format("YYYY-MM-DD")
    : dayjs().tz(ROME_TIME_ZONE).format("YYYY-MM-DD");
}
