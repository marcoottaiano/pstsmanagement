import { z } from "zod";

import { USER_AVATAR_BACKGROUNDS, USER_AVATAR_STYLES } from "@/features/avatar/avatar";

const avatarStyleValues = USER_AVATAR_STYLES.map((style) => style.value) as [
  (typeof USER_AVATAR_STYLES)[number]["value"],
  ...(typeof USER_AVATAR_STYLES)[number]["value"][],
];
const avatarBackgroundValues = USER_AVATAR_BACKGROUNDS.map((background) => background.value) as [
  (typeof USER_AVATAR_BACKGROUNDS)[number]["value"],
  ...(typeof USER_AVATAR_BACKGROUNDS)[number]["value"][],
];

export const updateProfileAvatarSchema = z.object({
  avatarStyle: z.enum(avatarStyleValues),
  avatarBackground: z.enum(avatarBackgroundValues),
  avatarSeed: z
    .string({ error: "Inserisci un testo per generare l'avatar." })
    .trim()
    .min(1, "Inserisci un testo per generare l'avatar.")
    .max(80, "Usa al massimo 80 caratteri."),
});

export const updateProfileNameSchema = z.object({
  displayName: z
    .string({ error: "Inserisci il nome." })
    .trim()
    .min(2, "Il nome deve contenere almeno 2 caratteri.")
    .max(120, "Usa al massimo 120 caratteri."),
});

export const updateProfilePasswordSchema = z
  .object({
    password: z
      .string({ error: "Inserisci la nuova password." })
      .min(8, "La password deve contenere almeno 8 caratteri."),
    confirmPassword: z.string({ error: "Ripeti la nuova password." }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Le password non coincidono.",
    path: ["confirmPassword"],
  });
