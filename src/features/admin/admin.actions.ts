"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { recordUserManagementActivity } from "@/features/activity/activity.audit";
import { getAuthenticatedContext } from "@/features/auth/auth.data";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { deleteUserSchema, inviteUserSchema, setUserSectorAccessSchema } from "./admin.schemas";
import type {
  AdminActionResult,
  DeleteUserInput,
  InviteUserInput,
  SetUserSectorAccessInput,
} from "./admin.types";

async function getAdminContext() {
  const context = await getAuthenticatedContext();
  return context?.isAdmin ? context : null;
}

function revalidateUserManagement(): void {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/admin/activity");
  revalidatePath("/dashboard/admin/users");
}

async function getApplicationOrigin(): Promise<string | null> {
  const result = z
    .string()
    .url()
    .safeParse(process.env.NEXT_PUBLIC_SITE_URL ?? (await headers()).get("origin"));
  return result.success ? result.data.replace(/\/$/, "") : null;
}

export async function inviteUser(input: InviteUserInput): Promise<AdminActionResult> {
  const parsed = inviteUserSchema.safeParse(input);
  const context = parsed.success ? await getAdminContext() : null;
  if (!parsed.success || !context) {
    return { error: "I dati inseriti non sono validi o non hai i permessi necessari." };
  }

  const origin = await getApplicationOrigin();
  if (!origin) {
    return { error: "Non è stato possibile determinare l’indirizzo dell’applicazione." };
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(parsed.data.email, {
    data: { display_name: parsed.data.displayName },
    redirectTo: `${origin}/auth/callback?next=/accept-invite`,
  });

  if (error || !data.user) {
    console.error("Admin user invitation failed.", { message: error?.message });
    return {
      error:
        "Non è stato possibile invitare l’utente. Verifica che l’indirizzo non sia già registrato.",
    };
  }

  const profileResult = await adminClient
    .from("profiles")
    .update({ display_name: parsed.data.displayName })
    .eq("id", data.user.id);

  if (profileResult.error) {
    console.error("Invited user profile update failed.", {
      code: profileResult.error.code,
      message: profileResult.error.message,
      userId: data.user.id,
    });
    await recordUserManagementActivity({
      actor: context.identity,
      action: "INVITED",
      targetUserId: data.user.id,
      targetDisplayName: parsed.data.displayName,
      metadata: {
        email: parsed.data.email,
        configuration_status: "PROFILE_UPDATE_FAILED",
      },
    });
    return {
      error: "L’invito è stato inviato, ma il profilo non è stato configurato completamente.",
    };
  }

  const supabase = await createClient();
  const { error: sectorError } = await supabase.rpc("set_user_sector_access", {
    target_user_id: data.user.id,
    target_sector_ids: [...parsed.data.sectorIds],
  });

  if (sectorError) {
    console.error("Invited user sector assignment failed.", {
      code: sectorError.code,
      message: sectorError.message,
      userId: data.user.id,
    });
    await recordUserManagementActivity({
      actor: context.identity,
      action: "INVITED",
      targetUserId: data.user.id,
      targetDisplayName: parsed.data.displayName,
      metadata: {
        email: parsed.data.email,
        sector_ids: [...parsed.data.sectorIds],
        configuration_status: "SECTOR_ASSIGNMENT_FAILED",
      },
    });
    revalidateUserManagement();
    return {
      error: "L’invito è stato inviato, ma i settori devono essere assegnati manualmente.",
    };
  }

  await recordUserManagementActivity({
    actor: context.identity,
    action: "INVITED",
    targetUserId: data.user.id,
    targetDisplayName: parsed.data.displayName,
    metadata: {
      email: parsed.data.email,
      sector_ids: [...parsed.data.sectorIds],
      configuration_status: "COMPLETED",
    },
  });
  revalidateUserManagement();
  return { success: `Invito inviato a ${parsed.data.email}.` };
}

export async function setUserSectorAccess(
  input: SetUserSectorAccessInput,
): Promise<AdminActionResult> {
  const parsed = setUserSectorAccessSchema.safeParse(input);
  const context = parsed.success ? await getAdminContext() : null;
  if (!parsed.success || !context) {
    return { error: "I dati inseriti non sono validi o non hai i permessi necessari." };
  }

  const adminClient = createAdminClient();
  const profileResult = await adminClient
    .from("profiles")
    .select("display_name, email")
    .eq("id", parsed.data.userId)
    .maybeSingle();
  if (profileResult.error || !profileResult.data) {
    console.error("Admin user access target query failed.", {
      code: profileResult.error?.code,
      message: profileResult.error?.message,
      userId: parsed.data.userId,
    });
    return { error: "Non è stato possibile verificare l’utente selezionato." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_user_sector_access", {
    target_user_id: parsed.data.userId,
    target_sector_ids: [...parsed.data.sectorIds],
  });

  if (error) {
    console.error("Admin user sector update failed.", {
      code: error.code,
      message: error.message,
      userId: parsed.data.userId,
    });
    return { error: "Non è stato possibile aggiornare gli accessi dell’utente." };
  }

  await recordUserManagementActivity({
    actor: context.identity,
    action: "ACCESS_UPDATED",
    targetUserId: parsed.data.userId,
    targetDisplayName: profileResult.data.display_name,
    metadata: {
      email: profileResult.data.email,
      sector_ids: [...parsed.data.sectorIds],
    },
  });
  revalidateUserManagement();
  return { success: "Accessi aggiornati." };
}

export async function deleteUser(input: DeleteUserInput): Promise<AdminActionResult> {
  const parsed = deleteUserSchema.safeParse(input);
  const context = await getAuthenticatedContext();
  if (!parsed.success || !context?.isAdmin) {
    return { error: "L’utente selezionato non è valido o non hai i permessi necessari." };
  }

  if (parsed.data.userId === context.identity.id) {
    return { error: "Non puoi eliminare il tuo account da questa sezione." };
  }

  const adminClient = createAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("role, display_name, email")
    .eq("id", parsed.data.userId)
    .maybeSingle();

  if (profileError) {
    console.error("Delete user role check failed.", {
      code: profileError.code,
      message: profileError.message,
      userId: parsed.data.userId,
    });
    return { error: "Non è stato possibile verificare il ruolo dell’utente." };
  }

  if (profile?.role === "ADMIN") {
    return { error: "Gli utenti amministratori non possono essere eliminati." };
  }

  const deletedDisplayName = profile?.display_name ?? "Utente eliminato";
  const deletedEmail = profile?.email ?? null;
  const { error } = await adminClient.auth.admin.deleteUser(parsed.data.userId);
  if (error) {
    console.error("Admin user deletion failed.", {
      message: error.message,
      status: error.status,
      userId: parsed.data.userId,
    });
    return {
      error:
        "Non è stato possibile eliminare l’utente. Potrebbero essere presenti dati associati al suo account.",
    };
  }

  await recordUserManagementActivity({
    actor: context.identity,
    action: "USER_DELETED",
    targetUserId: parsed.data.userId,
    targetDisplayName: deletedDisplayName,
    metadata: { email: deletedEmail },
  });
  revalidateUserManagement();
  return { success: "Utente eliminato definitivamente." };
}
