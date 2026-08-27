"use server";

import { revalidatePath } from "next/cache";

import { authClaimsSchema } from "@/features/auth/auth.schemas";
import { createClient } from "@/lib/supabase/server";

import {
  updateProfileAvatarSchema,
  updateProfileNameSchema,
  updateProfilePasswordSchema,
} from "./profile.schemas";
import type {
  ProfileAvatarActionState,
  ProfileNameActionState,
  ProfilePasswordActionState,
} from "./profile.types";

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claimsResult = authClaimsSchema.safeParse(claimsData?.claims);

  if (claimsError || !claimsResult.success) {
    return null;
  }

  return claimsResult.data.sub;
}

export async function updateProfileAvatarAction(
  _previousState: ProfileAvatarActionState,
  formData: FormData,
): Promise<ProfileAvatarActionState> {
  const validationResult = updateProfileAvatarSchema.safeParse({
    avatarStyle: formData.get("avatarStyle"),
    avatarBackground: formData.get("avatarBackground"),
    avatarSeed: formData.get("avatarSeed"),
  });

  if (!validationResult.success) {
    const fieldErrors = validationResult.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        avatarStyle: fieldErrors.avatarStyle?.[0],
        avatarBackground: fieldErrors.avatarBackground?.[0],
        avatarSeed: fieldErrors.avatarSeed?.[0],
      },
    };
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    return { formError: "Sessione non valida. Accedi di nuovo e riprova." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      avatar_style: validationResult.data.avatarStyle,
      avatar_background: validationResult.data.avatarBackground,
      avatar_seed: validationResult.data.avatarSeed,
    })
    .eq("id", userId);

  if (error) {
    console.error("Profile avatar update failed.", {
      code: error.code,
      message: error.message,
      details: error.details,
    });
    return { formError: "Non è stato possibile aggiornare l'avatar. Riprova." };
  }

  revalidatePath("/dashboard", "layout");
  return { success: "Avatar aggiornato." };
}

export async function updateProfileNameAction(
  _previousState: ProfileNameActionState,
  formData: FormData,
): Promise<ProfileNameActionState> {
  const validationResult = updateProfileNameSchema.safeParse({
    displayName: formData.get("displayName"),
  });

  if (!validationResult.success) {
    return {
      fieldErrors: {
        displayName: validationResult.error.flatten().fieldErrors.displayName?.[0],
      },
    };
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return { formError: "Sessione non valida. Accedi di nuovo e riprova." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: validationResult.data.displayName })
    .eq("id", userId);

  if (error) {
    return { formError: "Non è stato possibile aggiornare il nome. Riprova." };
  }

  revalidatePath("/dashboard", "layout");
  return { success: "Nome aggiornato." };
}

export async function updateProfilePasswordAction(
  _previousState: ProfilePasswordActionState,
  formData: FormData,
): Promise<ProfilePasswordActionState> {
  const validationResult = updateProfilePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validationResult.success) {
    const fieldErrors = validationResult.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        password: fieldErrors.password?.[0],
        confirmPassword: fieldErrors.confirmPassword?.[0],
      },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: validationResult.data.password });

  if (error) {
    return { formError: "Non è stato possibile aggiornare la password. Riprova." };
  }

  return { success: "Password aggiornata." };
}
