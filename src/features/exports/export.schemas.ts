import { z } from "zod";

const uuidSchema = z.string().uuid();

export const calendarExportQuerySchema = z.object({
  sector: uuidSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  groups: z
    .string()
    .optional()
    .transform((value) => (value ? value.split(",") : []))
    .pipe(z.array(uuidSchema)),
  format: z.enum(["pdf", "xlsx"]),
});
