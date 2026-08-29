const COMPLETION_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("it-IT", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Rome",
});

export function formatCompletionDateTime(value: string): string {
  return COMPLETION_DATE_TIME_FORMATTER.format(new Date(value));
}
