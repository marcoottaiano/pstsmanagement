import { z } from "zod";

export const activityActionSchema = z.enum([
  "CREATED",
  "UPDATED",
  "DELETED",
  "COMPLETED",
  "REOPENED",
  "ARCHIVED",
  "RESTORED",
  "INVITED",
  "ACCESS_UPDATED",
  "USER_DELETED",
]);

export const activityEntityTypeSchema = z.enum([
  "SCHEDULED_WORK",
  "REMINDER",
  "OBJECTIVE",
  "GROUP",
  "USER",
]);

export const activityPeriodSchema = z.enum(["TODAY", "7_DAYS", "30_DAYS", "ALL"]);

export const activityLogRowSchema = z
  .object({
    id: z.string().uuid(),
    actor_id: z.string().uuid().nullable(),
    actor_name: z.string().min(1),
    actor_email: z.string().email().nullable(),
    action: activityActionSchema,
    entity_type: activityEntityTypeSchema,
    entity_id: z.string().uuid().nullable(),
    entity_title: z.string().min(1),
    sector_id: z.string().uuid().nullable(),
    metadata: z.record(z.string(), z.unknown()),
    created_at: z.iso.datetime(),
  })
  .transform((row) => ({
    id: row.id,
    actorId: row.actor_id,
    actorName: row.actor_name,
    actorEmail: row.actor_email,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityTitle: row.entity_title,
    sectorId: row.sector_id,
    metadata: row.metadata,
    createdAt: row.created_at,
  }));

export const activityActorOptionSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string().min(1),
  email: z.string().email().nullable(),
});

export const activitySectorOptionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
});

function getSingleSearchParam(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}

const optionalUuidSearchParam = z.preprocess(
  getSingleSearchParam,
  z.string().uuid().optional().catch(undefined),
);

export const activityLogFiltersSchema = z.object({
  actor: optionalUuidSearchParam,
  entity: z.preprocess(getSingleSearchParam, activityEntityTypeSchema.optional().catch(undefined)),
  sector: optionalUuidSearchParam,
  period: z.preprocess(getSingleSearchParam, activityPeriodSchema.catch("30_DAYS")),
  page: z.preprocess(getSingleSearchParam, z.coerce.number().int().positive().catch(1)),
});
