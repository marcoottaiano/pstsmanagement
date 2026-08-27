import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

export const ROME_TIME_ZONE = "Europe/Rome";
const DATE_FORMAT = "YYYY-MM-DD";
const DATE_TIME_FORMAT = "YYYY-MM-DDTHH:mm";

export type VisibleMonthRange = Readonly<{
  startAt: string;
  endAt: string;
}>;

export function isValidCalendarDate(value: string | undefined): value is string {
  return Boolean(value && dayjs(value, DATE_FORMAT, true).isValid());
}

export function getTodayInRome(): string {
  return dayjs().tz(ROME_TIME_ZONE).format(DATE_FORMAT);
}

export function getVisibleMonthRange(calendarDate: string): VisibleMonthRange {
  const monthStart = dayjs
    .tz(`${calendarDate}T00:00`, DATE_TIME_FORMAT, ROME_TIME_ZONE)
    .startOf("month");

  return {
    startAt: monthStart.toISOString(),
    endAt: monthStart.add(1, "month").toISOString(),
  };
}

export function getUpcomingWeekRange(): VisibleMonthRange {
  const now = dayjs().tz(ROME_TIME_ZONE);
  return {
    startAt: now.toISOString(),
    endAt: now.add(7, "day").toISOString(),
  };
}

export function romeDateTimeToIso(date: string, time = "00:00"): string | null {
  const localValue = `${date}T${time}`;
  const parsed = dayjs.tz(localValue, DATE_TIME_FORMAT, ROME_TIME_ZONE);

  if (!parsed.isValid() || parsed.format(DATE_TIME_FORMAT) !== localValue) {
    return null;
  }

  return parsed.toISOString();
}

export function inclusiveAllDayEndToIso(date: string): string | null {
  const parsed = dayjs.tz(`${date}T00:00`, DATE_TIME_FORMAT, ROME_TIME_ZONE);

  if (!parsed.isValid()) {
    return null;
  }

  return parsed.add(1, "day").toISOString();
}

export function storedDateTimeToCalendarValue(value: string): string {
  return dayjs.utc(value).tz(ROME_TIME_ZONE).format("YYYY-MM-DDTHH:mm:ss");
}

export function storedDateToRomeDate(value: string): string {
  return dayjs.utc(value).tz(ROME_TIME_ZONE).format(DATE_FORMAT);
}

export function storedExclusiveEndToInclusiveDate(value: string): string {
  return dayjs.utc(value).tz(ROME_TIME_ZONE).subtract(1, "day").format(DATE_FORMAT);
}

export function storedDateTimeToFormParts(value: string): Readonly<{ date: string; time: string }> {
  const dateTime = dayjs.utc(value).tz(ROME_TIME_ZONE);
  return { date: dateTime.format(DATE_FORMAT), time: dateTime.format("HH:mm") };
}

export function roundCurrentRomeTime(): Readonly<{
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}> {
  const roundedStart = dayjs().tz(ROME_TIME_ZONE).add(15, "minute").startOf("hour");
  const end = roundedStart.add(1, "hour");

  return {
    startDate: roundedStart.format(DATE_FORMAT),
    startTime: roundedStart.format("HH:mm"),
    endDate: end.format(DATE_FORMAT),
    endTime: end.format("HH:mm"),
  };
}
