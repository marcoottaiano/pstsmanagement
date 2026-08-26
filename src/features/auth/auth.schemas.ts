import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ error: "Inserisci un indirizzo email valido." })
    .trim()
    .email("Inserisci un indirizzo email valido.")
    .transform((email) => email.toLowerCase()),
  password: z.string({ error: "Inserisci la password." }).min(1, "Inserisci la password."),
});

export const passwordResetRequestSchema = z.object({
  email: z
    .string({ error: "Inserisci un indirizzo email valido." })
    .trim()
    .email("Inserisci un indirizzo email valido.")
    .transform((email) => email.toLowerCase()),
});

export const updatePasswordSchema = z
  .object({
    password: z
      .string({ error: "Inserisci una nuova password." })
      .min(8, "La password deve contenere almeno 8 caratteri."),
    confirmPassword: z.string({ error: "Conferma la nuova password." }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Le password non coincidono.",
    path: ["confirmPassword"],
  });

export const authClaimsSchema = z.object({
  sub: z.string().uuid(),
  email: z.string().email().optional(),
});

export const sectorSchema = z.object({
  id: z.string().uuid(),
  code: z.enum(["artistic", "rhythmic"]),
  name: z.string().min(1),
});
