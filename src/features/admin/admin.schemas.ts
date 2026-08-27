import { z } from "zod";

import { sectorSchema, userRoleSchema } from "@/features/auth/auth.schemas";

const displayNameSchema = z
  .string({ error: "Inserisci il nome dell’utente." })
  .trim()
  .min(2, "Inserisci almeno 2 caratteri.")
  .max(100, "Il nome non può superare 100 caratteri.");

const emailSchema = z
  .string({ error: "Inserisci un indirizzo email valido." })
  .trim()
  .email("Inserisci un indirizzo email valido.")
  .transform((email) => email.toLowerCase());

const sectorIdsSchema = z
  .array(z.string().uuid("Il settore selezionato non è valido."))
  .min(1, "Seleziona almeno un settore.")
  .max(2, "Puoi selezionare al massimo due settori.")
  .refine((sectorIds) => new Set(sectorIds).size === sectorIds.length, {
    message: "Ogni settore può essere selezionato una sola volta.",
  });

export const inviteUserSchema = z.object({
  displayName: displayNameSchema,
  email: emailSchema,
  sectorIds: sectorIdsSchema,
});

export const setUserSectorAccessSchema = z.object({
  userId: z.string().uuid("L’utente selezionato non è valido."),
  sectorIds: sectorIdsSchema,
});

export const deleteUserSchema = z.object({
  userId: z.string().uuid("L’utente selezionato non è valido."),
});

export const managedProfileSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string().min(1),
  email: z.string().email().nullable(),
  role: userRoleSchema,
});

export const userSectorMembershipSchema = z.object({
  user_id: z.string().uuid(),
  sector_id: z.string().uuid(),
});

export const managedSectorSchema = sectorSchema;

export const userDisplayMetadataSchema = z.object({
  display_name: z.string().trim().min(1).optional(),
});
