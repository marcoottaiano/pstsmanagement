import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ error: "Inserisci un indirizzo email valido." })
    .trim()
    .email("Inserisci un indirizzo email valido.")
    .transform((email) => email.toLowerCase()),
  password: z.string({ error: "Inserisci la password." }).min(1, "Inserisci la password."),
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
