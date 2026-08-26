import type { Objective, ObjectiveStatus } from "./objectives.types";

export const OBJECTIVE_STATUS_PRESENTATION: Readonly<
  Record<ObjectiveStatus, Readonly<{ label: string; color: string }>>
> = {
  NOT_STARTED: { label: "Da iniziare", color: "gray" },
  IN_PROGRESS: { label: "In corso", color: "blue" },
  COMPLETED: { label: "Completato", color: "teal" },
  POSTPONED: { label: "Posticipato", color: "orange" },
};

export function getObjectiveSections(objectives: readonly Objective[]) {
  const statuses: readonly ObjectiveStatus[] = [
    "NOT_STARTED",
    "IN_PROGRESS",
    "POSTPONED",
    "COMPLETED",
  ];

  return statuses
    .map((status) => ({
      status,
      label: OBJECTIVE_STATUS_PRESENTATION[status].label,
      objectives: objectives.filter((objective) => objective.status === status),
    }))
    .filter((section) => section.objectives.length > 0);
}

export function formatObjectivePeriod(objective: Objective): string {
  if (objective.periodStart && objective.periodEnd) {
    return `${objective.periodStart} - ${objective.periodEnd}`;
  }
  return objective.periodStart ?? objective.periodEnd ?? "Nessun periodo definito";
}
