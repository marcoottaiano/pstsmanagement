import { z } from "zod";

const uuidSchema = z.string().uuid();
const timestampSchema = z.string().datetime({ offset: true });
const titleSchema = z
  .string()
  .trim()
  .min(1, "Inserisci un titolo.")
  .max(200, "Il titolo è troppo lungo.");
const descriptionSchema = z.string().trim().max(2_000, "La descrizione è troppo lunga.").nullable();

const scheduledWorkFields = {
  sectorId: uuidSchema,
  groupId: uuidSchema,
  title: titleSchema,
  description: descriptionSchema,
  startAt: timestampSchema,
  endAt: timestampSchema.nullable(),
  allDay: z.boolean(),
};

function hasValidInterval(value: { startAt: string; endAt: string | null }): boolean {
  return value.endAt === null || Date.parse(value.endAt) >= Date.parse(value.startAt);
}

export const scheduledWorkDatabaseSchema = z
  .object({
    id: uuidSchema,
    sector_id: uuidSchema,
    group_id: uuidSchema,
    title: z.string().min(1),
    description: z.string().nullable(),
    start_at: timestampSchema,
    end_at: timestampSchema.nullable(),
    all_day: z.boolean(),
    created_by: uuidSchema.nullable(),
    created_at: timestampSchema,
    updated_at: timestampSchema,
  })
  .transform((work) => ({
    id: work.id,
    sectorId: work.sector_id,
    groupId: work.group_id,
    title: work.title,
    description: work.description,
    startAt: work.start_at,
    endAt: work.end_at,
    allDay: work.all_day,
    createdBy: work.created_by,
    createdAt: work.created_at,
    updatedAt: work.updated_at,
  }));

export const createScheduledWorkSchema = z
  .object(scheduledWorkFields)
  .refine(hasValidInterval, { path: ["endAt"], message: "La fine non può precedere l’inizio." });

export const updateScheduledWorkSchema = z
  .object({ id: uuidSchema, ...scheduledWorkFields })
  .refine(hasValidInterval, { path: ["endAt"], message: "La fine non può precedere l’inizio." });

export const deleteScheduledWorkSchema = z.object({
  id: uuidSchema,
  sectorId: uuidSchema,
});

export const updateScheduledWorkDatesSchema = z
  .object({
    id: uuidSchema,
    sectorId: uuidSchema,
    startAt: timestampSchema,
    endAt: timestampSchema.nullable(),
    allDay: z.boolean(),
  })
  .refine(hasValidInterval, { path: ["endAt"], message: "La fine non può precedere l’inizio." });
