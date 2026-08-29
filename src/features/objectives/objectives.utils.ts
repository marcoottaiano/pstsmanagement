import dayjs from "dayjs";

import { getRomeDayKey } from "@/features/reminders/reminders.dates";

import type { Objective, ObjectiveStatus } from "./objectives.types";

export type ObjectiveSectionKey = ObjectiveStatus | "OVERDUE";

export const OBJECTIVE_STATUS_PRESENTATION: Readonly<
  Record<ObjectiveSectionKey, Readonly<{ label: string; color: string }>>
> = {
  OVERDUE: { label: "In ritardo", color: "orange" },
  NOT_STARTED: { label: "Da iniziare", color: "gray" },
  IN_PROGRESS: { label: "In corso", color: "blue" },
  COMPLETED: { label: "Completati", color: "teal" },
};

export function isObjectiveOverdue(objective: Objective): boolean {
  return (
    objective.status !== "COMPLETED" &&
    objective.periodEnd !== null &&
    objective.periodEnd < getRomeDayKey()
  );
}

export function getObjectiveSections(objectives: readonly Objective[]) {
  const sectionKeys: readonly ObjectiveSectionKey[] = [
    "OVERDUE",
    "NOT_STARTED",
    "IN_PROGRESS",
    "COMPLETED",
  ];

  return sectionKeys
    .map((key) => ({
      key,
      label: OBJECTIVE_STATUS_PRESENTATION[key].label,
      objectives: objectives.filter((objective) =>
        key === "OVERDUE"
          ? isObjectiveOverdue(objective)
          : objective.status === key && !isObjectiveOverdue(objective),
      ),
    }))
    .filter((section) => section.objectives.length > 0);
}

export function formatObjectivePeriod(objective: Objective): string {
  if (objective.periodStart && objective.periodEnd) {
    return `${formatObjectiveDate(objective.periodStart)} - ${formatObjectiveDate(objective.periodEnd)}`;
  }

  const periodDate = objective.periodStart ?? objective.periodEnd;
  return periodDate ? formatObjectiveDate(periodDate) : "Nessun periodo definito";
}

function formatObjectiveDate(value: string): string {
  return dayjs(value).format("DD/MM/YYYY");
}
