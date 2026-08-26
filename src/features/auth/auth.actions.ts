"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { loginSchema, passwordResetRequestSchema, updatePasswordSchema } from "./auth.schemas";
import type { LoginActionState, PasswordResetActionState } from "./auth.types";

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const validationResult = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validationResult.success) {
    const fieldErrors = validationResult.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(validationResult.data);

  if (error) {
    return {
      formError: "Credenziali non valide. Controlla email e password e riprova.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error("Non è stato possibile terminare la sessione.");
  }

  revalidatePath("/", "layout");
  redirect("/login");
}

export async function requestPasswordResetAction(
  _previousState: PasswordResetActionState,
  formData: FormData,
): Promise<PasswordResetActionState> {
  const validationResult = passwordResetRequestSchema.safeParse({
    email: formData.get("email"),
  });

  if (!validationResult.success) {
    return { fieldErrors: { email: validationResult.error.flatten().fieldErrors.email?.[0] } };
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? (await headers()).get("origin");
  if (!origin) {
    return { formError: "Impossibile preparare il recupero password. Riprova tra poco." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(validationResult.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { formError: "Non è stato possibile inviare l'email. Riprova tra poco." };
  }

  return {
    success: "Se l'indirizzo è registrato, riceverai a breve un'email con le istruzioni.",
  };
}

export async function updatePasswordAction(
  _previousState: PasswordResetActionState,
  formData: FormData,
): Promise<PasswordResetActionState> {
  const validationResult = updatePasswordSchema.safeParse({
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

  revalidatePath("/", "layout");
  redirect("/login?reset=success");
}
