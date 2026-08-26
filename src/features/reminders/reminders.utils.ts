import { getRomeDayKey } from "./reminders.dates";
import type { Reminder, ReminderPriority } from "./reminders.types";

type ReminderSectionKey = "OVERDUE" | "TODAY" | "UPCOMING" | "NO_DUE" | "COMPLETED";

export type ReminderSection = Readonly<{
  key: ReminderSectionKey;
  label: string;
  reminders: readonly Reminder[];
}>;

const PRIORITY_RANK: Record<ReminderPriority, number> = {
  HIGH: 0,
  NORMAL: 1,
  LOW: 2,
};

const SECTION_LABELS: ReadonlyArray<Readonly<{ key: ReminderSectionKey; label: string }>> = [
  { key: "OVERDUE", label: "Scaduti" },
  { key: "TODAY", label: "Oggi" },
  { key: "UPCOMING", label: "Prossimi" },
  { key: "NO_DUE", label: "Senza scadenza" },
  { key: "COMPLETED", label: "Completati" },
];

function isAssignedTo(reminder: Reminder, userId: string): boolean {
  return reminder.assignees.some((assignee) => assignee.id === userId);
}

function compareOpenReminders(first: Reminder, second: Reminder, currentUserId: string): number {
  return (
    Number(isAssignedTo(second, currentUserId)) - Number(isAssignedTo(first, currentUserId)) ||
    PRIORITY_RANK[first.priority] - PRIORITY_RANK[second.priority] ||
    (first.dueAt ?? "").localeCompare(second.dueAt ?? "") ||
    first.title.localeCompare(second.title, "it")
  );
}

function compareCompletedReminders(
  first: Reminder,
  second: Reminder,
  currentUserId: string,
): number {
  return (
    Number(isAssignedTo(second, currentUserId)) - Number(isAssignedTo(first, currentUserId)) ||
    PRIORITY_RANK[first.priority] - PRIORITY_RANK[second.priority] ||
    second.updatedAt.localeCompare(first.updatedAt)
  );
}

export function getReminderSections(
  reminders: readonly Reminder[],
  currentUserId: string,
): readonly ReminderSection[] {
  const today = getRomeDayKey();
  const buckets: Record<ReminderSectionKey, Reminder[]> = {
    OVERDUE: [],
    TODAY: [],
    UPCOMING: [],
    NO_DUE: [],
    COMPLETED: [],
  };

  for (const reminder of reminders) {
    if (reminder.status === "COMPLETED") {
      buckets.COMPLETED.push(reminder);
    } else if (!reminder.dueAt) {
      buckets.NO_DUE.push(reminder);
    } else {
      const dueDay = getRomeDayKey(reminder.dueAt);
      const key = dueDay < today ? "OVERDUE" : dueDay === today ? "TODAY" : "UPCOMING";
      buckets[key].push(reminder);
    }
  }

  return SECTION_LABELS.flatMap(({ key, label }) => {
    const sorted = buckets[key].toSorted((first, second) =>
      key === "COMPLETED"
        ? compareCompletedReminders(first, second, currentUserId)
        : compareOpenReminders(first, second, currentUserId),
    );
    return sorted.length > 0 ? [{ key, label, reminders: sorted }] : [];
  });
}
