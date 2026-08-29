import { z } from "zod";

const uuidSchema = z.string().uuid();
const timestampSchema = z.string().datetime({ offset: true });

export const notificationKindSchema = z.enum([
  "REMINDER_ASSIGNED",
  "REMINDER_DUE_TODAY",
  "REMINDER_DUE_SOON",
  "REMINDER_OVERDUE",
]);

export const notificationRowSchema = z
  .object({
    id: uuidSchema,
    reminder_id: uuidSchema,
    sector_id: uuidSchema,
    kind: notificationKindSchema,
    title: z.string().min(1),
    message: z.string().min(1),
    due_at: timestampSchema.nullable(),
    created_at: timestampSchema,
    read_at: timestampSchema.nullable(),
  })
  .transform((notification) => ({
    id: notification.id,
    reminderId: notification.reminder_id,
    sectorId: notification.sector_id,
    kind: notification.kind,
    title: notification.title,
    message: notification.message,
    dueAt: notification.due_at,
    createdAt: notification.created_at,
    readAt: notification.read_at,
  }));

export const notificationReminderSchema = z.object({
  id: uuidSchema,
  sector_id: uuidSchema,
  title: z.string().min(1),
  due_at: timestampSchema.nullable(),
  due_all_day: z.boolean(),
  created_by: uuidSchema.nullable(),
});

export const notificationAssigneeSchema = z.object({
  reminder_id: uuidSchema,
});

export const existingGeneratedNotificationSchema = z.object({
  id: uuidSchema,
  reminder_id: uuidSchema,
  kind: notificationKindSchema,
});

export const markNotificationReadSchema = z.object({
  notificationId: uuidSchema,
});
