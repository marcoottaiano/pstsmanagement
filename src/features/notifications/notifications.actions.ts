"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedContext } from "@/features/auth/auth.data";
import { createClient } from "@/lib/supabase/server";

import { markNotificationReadSchema } from "./notifications.schemas";
import type { NotificationActionResult } from "./notifications.types";

function revalidateNotificationRoutes(): void {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/admin/users");
}

export async function markNotificationRead(input: unknown): Promise<NotificationActionResult> {
  const parsed = markNotificationReadSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "La notifica selezionata non è valida." };
  }

  const context = await getAuthenticatedContext();
  if (!context) {
    return { error: "Sessione non valida. Accedi nuovamente." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", parsed.data.notificationId)
    .eq("recipient_id", context.identity.id);

  if (error) {
    console.error("Mark notification as read failed.", {
      code: error.code,
      message: error.message,
    });
    return { error: "Non è stato possibile segnare la notifica come letta." };
  }

  revalidateNotificationRoutes();
  return {};
}

export async function markAllNotificationsRead(): Promise<NotificationActionResult> {
  const context = await getAuthenticatedContext();
  if (!context) {
    return { error: "Sessione non valida. Accedi nuovamente." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", context.identity.id)
    .is("read_at", null);

  if (error) {
    console.error("Mark all notifications as read failed.", {
      code: error.code,
      message: error.message,
    });
    return { error: "Non è stato possibile segnare le notifiche come lette." };
  }

  revalidateNotificationRoutes();
  return {};
}
