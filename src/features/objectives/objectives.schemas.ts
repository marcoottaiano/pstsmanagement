import { z } from "zod";

const uuidSchema = z.string().uuid();
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Inserisci una data valida.");
const titleSchema = z
  .string()
  .trim()
  .min(1, "Inserisci un titolo.")
  .max(200, "Il titolo è troppo lungo.");
const descriptionSchema = z.string().trim().max(2_000, "La descrizione è troppo lunga.").nullable();

export const objectiveStatusSchema = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "POSTPONED",
]);

const objectiveFields = {
  sectorId: uuidSchema,
  groupId: uuidSchema,
  title: titleSchema,
  description: descriptionSchema,
  status: objectiveStatusSchema,
  periodStart: dateSchema.nullable(),
  periodEnd: dateSchema.nullable(),
};

function validatePeriod(
  value: { periodStart: string | null; periodEnd: string | null },
  context: z.RefinementCtx,
): void {
  if (value.periodStart && value.periodEnd && value.periodEnd < value.periodStart) {
    context.addIssue({
      code: "custom",
      path: ["periodEnd"],
      message: "La fine del periodo deve essere successiva all'inizio.",
    });
  }
}

export const objectiveDatabaseSchema = z
  .object({
    id: uuidSchema,
    sector_id: uuidSchema,
    group_id: uuidSchema,
    title: z.string().min(1),
    description: z.string().nullable(),
    status: objectiveStatusSchema,
    period_start: dateSchema.nullable(),
    period_end: dateSchema.nullable(),
    created_by: uuidSchema,
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
  })
  .transform((objective) => ({
    id: objective.id,
    sectorId: objective.sector_id,
    groupId: objective.group_id,
    title: objective.title,
    description: objective.description,
    status: objective.status,
    periodStart: objective.period_start,
    periodEnd: objective.period_end,
    createdBy: objective.created_by,
    createdAt: objective.created_at,
    updatedAt: objective.updated_at,
  }));

export const createObjectiveSchema = z.object(objectiveFields).superRefine(validatePeriod);
export const updateObjectiveSchema = z
  .object({ id: uuidSchema, ...objectiveFields })
  .superRefine(validatePeriod);
export const updateObjectiveStatusSchema = z.object({
  id: uuidSchema,
  sectorId: uuidSchema,
  status: objectiveStatusSchema,
});
export const deleteObjectiveSchema = z.object({ id: uuidSchema, sectorId: uuidSchema });
