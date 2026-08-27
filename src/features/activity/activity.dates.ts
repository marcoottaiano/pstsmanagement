import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import type { ActivityPeriod } from "./activity.types";

dayjs.extend(utc);
dayjs.extend(timezone);

const ROME_TIME_ZONE = "Europe/Rome";
const activityDateFormatter = new Intl.DateTimeFormat("it-IT", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: ROME_TIME_ZONE,
});

export function getActivityPeriodStart(period: ActivityPeriod): string | null {
  const now = dayjs().tz(ROME_TIME_ZONE);

  if (period === "TODAY") {
    return now.startOf("day").toISOString();
  }
  if (period === "7_DAYS") {
    return now.subtract(7, "day").toISOString();
  }
  if (period === "30_DAYS") {
    return now.subtract(30, "day").toISOString();
  }
  return null;
}

export function formatActivityDate(value: string): string {
  return activityDateFormatter.format(new Date(value));
}
