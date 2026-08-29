export type GroupWorkload = Readonly<{
  groupId: string;
  groupName: string;
  scheduledWorkCount: number;
  openReminderCount: number;
}>;

export type DashboardSummaryData = Readonly<{
  imminentWorkCount: number;
  overdueReminderCount: number;
  lateCompletedReminderCount: number;
  completedObjectiveCount: number;
  lateCompletedObjectiveCount: number;
  totalObjectiveCount: number;
  lateObjectiveCount: number;
  groupWorkloads: readonly GroupWorkload[];
}>;
