import { z } from "zod";

const uuidSchema = z.string().uuid();
const timestampSchema = z.string().datetime({ offset: true });
const titleSchema = z
  .string()
  .trim()
  .min(1, "Inserisci un titolo.")
  .max(200, "Il titolo è troppo lungo.");
const descriptionSchema = z.string().trim().max(2_000, "La descrizione è troppo lunga.").nullable();

export const reminderStatusSchema = z.enum(["OPEN", "COMPLETED"]);
export const reminderPrioritySchema = z.enum(["LOW", "NORMAL", "HIGH"]);

const reminderFields = {
  sectorId: uuidSchema,
  groupId: uuidSchema.nullable(),
  title: titleSchema,
  description: descriptionSchema,
  dueAt: timestampSchema.nullable(),
  dueAllDay: z.boolean(),
  priority: reminderPrioritySchema,
  status: reminderStatusSchema,
  assigneeIds: uuidSchema
    .array()
    .max(100)
    .transform((ids) => [...new Set(ids)]),
};

export const reminderDatabaseSchema = z
  .object({
    id: uuidSchema,
    sector_id: uuidSchema,
    group_id: uuidSchema.nullable(),
    title: z.string().min(1),
    description: z.string().nullable(),
    due_at: timestampSchema.nullable(),
    due_all_day: z.boolean(),
    status: reminderStatusSchema,
    priority: reminderPrioritySchema,
    created_by: uuidSchema.nullable(),
    created_at: timestampSchema,
    updated_at: timestampSchema,
  })
  .transform((reminder) => ({
    id: reminder.id,
    sectorId: reminder.sector_id,
    groupId: reminder.group_id,
    title: reminder.title,
    description: reminder.description,
    dueAt: reminder.due_at,
    dueAllDay: reminder.due_all_day,
    status: reminder.status,
    priority: reminder.priority,
    createdBy: reminder.created_by,
    createdAt: reminder.created_at,
    updatedAt: reminder.updated_at,
  }));

export const reminderProfileSchema = z.object({
  id: uuidSchema,
  display_name: z.string().min(1),
  email: z.string().nullable(),
  avatar_background: z.string().nullable(),
  avatar_style: z.string().nullable(),
  avatar_seed: z.string().nullable(),
});

export const reminderAssigneeRowSchema = z.object({
  reminder_id: uuidSchema,
  user_id: uuidSchema,
});

export const createReminderSchema = z.object(reminderFields);
export const updateReminderSchema = z.object({ id: uuidSchema, ...reminderFields });

export const updateReminderStatusSchema = z.object({
  id: uuidSchema,
  sectorId: uuidSchema,
  status: reminderStatusSchema,
});

export const updateReminderDueSchema = z.object({
  id: uuidSchema,
  sectorId: uuidSchema,
  dueAt: timestampSchema,
  dueAllDay: z.boolean(),
});

export const deleteReminderSchema = z.object({
  id: uuidSchema,
  sectorId: uuidSchema,
});
