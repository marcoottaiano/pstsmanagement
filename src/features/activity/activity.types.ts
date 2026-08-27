export type ActivityAction =
  | "CREATED"
  | "UPDATED"
  | "DELETED"
  | "COMPLETED"
  | "REOPENED"
  | "ARCHIVED"
  | "RESTORED"
  | "INVITED"
  | "ACCESS_UPDATED"
  | "USER_DELETED";

export type ActivityEntityType = "SCHEDULED_WORK" | "REMINDER" | "OBJECTIVE" | "GROUP" | "USER";

export type ActivityPeriod = "TODAY" | "7_DAYS" | "30_DAYS" | "ALL";

export type ActivityLogItem = Readonly<{
  id: string;
  actorId: string | null;
  actorName: string;
  actorEmail: string | null;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string | null;
  entityTitle: string;
  sectorId: string | null;
  metadata: Readonly<Record<string, unknown>>;
  createdAt: string;
}>;

export type ActivityLogFilters = Readonly<{
  actorId?: string;
  entityType?: ActivityEntityType;
  sectorId?: string;
  period: ActivityPeriod;
  page: number;
}>;

export type ActivityFilterOption = Readonly<{
  value: string;
  label: string;
}>;

export type ActivityLogPageData = Readonly<{
  items: readonly ActivityLogItem[];
  actors: readonly ActivityFilterOption[];
  sectors: readonly ActivityFilterOption[];
  totalItems: number;
  totalPages: number;
}>;
