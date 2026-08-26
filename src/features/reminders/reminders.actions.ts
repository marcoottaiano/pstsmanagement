"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedContext } from "@/features/auth/auth.data";
import { createClient } from "@/lib/supabase/server";

import {
  createReminderSchema,
  deleteReminderSchema,
  updateReminderDueSchema,
  updateReminderSchema,
  updateReminderStatusSchema,
} from "./reminders.schemas";
import type {
  CreateReminderInput,
  DeleteReminderInput,
  ReminderActionResult,
  UpdateReminderDueInput,
  UpdateReminderInput,
  UpdateReminderStatusInput,
} from "./reminders.types";

function invalidInputResult(): ReminderActionResult {
  return { error: "I dati inseriti non sono validi. Controlla i campi e riprova." };
}

function databaseErrorResult(error: { message: string; code?: string }): ReminderActionResult {
  console.error("Reminder mutation failed.", { code: error.code, message: error.message });
  return { error: "Non è stato possibile salvare il promemoria. Riprova." };
}

async function canAccessSector(sectorId: string): Promise<boolean> {
  const context = await getAuthenticatedContext();
  return Boolean(context?.sectors.some((sector) => sector.id === sectorId));
}

async function isActiveGroupInSector(sectorId: string, groupId: string | null): Promise<boolean> {
  if (!groupId) {
    return true;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("group_nodes")
    .select("id")
    .eq("id", groupId)
    .eq("sector_id", sectorId)
    .eq("node_type", "GROUP")
    .eq("is_archived", false)
    .maybeSingle();

  return !error && data !== null;
}

async function assigneesBelongToSector(
  sectorId: string,
  assigneeIds: readonly string[],
): Promise<boolean> {
  if (assigneeIds.length === 0) {
    return true;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_sectors")
    .select("user_id")
    .eq("sector_id", sectorId)
    .in("user_id", [...assigneeIds]);

  if (error) {
    return false;
  }

  return new Set(data.map((membership) => membership.user_id)).size === assigneeIds.length;
}

async function canSaveReminder(
  sectorId: string,
  groupId: string | null,
  assigneeIds: readonly string[],
): Promise<boolean> {
  if (!(await canAccessSector(sectorId))) {
    return false;
  }

  const [validGroup, validAssignees] = await Promise.all([
    isActiveGroupInSector(sectorId, groupId),
    assigneesBelongToSector(sectorId, assigneeIds),
  ]);
  return validGroup && validAssignees;
}

function revalidateDashboard(): void {
  revalidatePath("/dashboard");
}

export async function createReminder(input: CreateReminderInput): Promise<ReminderActionResult> {
  const parsed = createReminderSchema.safeParse(input);
  if (
    !parsed.success ||
    !(await canSaveReminder(parsed.data.sectorId, parsed.data.groupId, parsed.data.assigneeIds))
  ) {
    return invalidInputResult();
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_reminder_with_assignees", {
    p_sector_id: parsed.data.sectorId,
    p_group_id: parsed.data.groupId,
    p_title: parsed.data.title,
    p_description: parsed.data.description,
    p_due_at: parsed.data.dueAt,
    p_due_all_day: parsed.data.dueAllDay,
    p_priority: parsed.data.priority,
    p_status: parsed.data.status,
    p_assignee_ids: parsed.data.assigneeIds,
  });

  if (error) {
    return databaseErrorResult(error);
  }

  revalidateDashboard();
  return { success: "Promemoria creato." };
}

export async function updateReminder(input: UpdateReminderInput): Promise<ReminderActionResult> {
  const parsed = updateReminderSchema.safeParse(input);
  if (
    !parsed.success ||
    !(await canSaveReminder(parsed.data.sectorId, parsed.data.groupId, parsed.data.assigneeIds))
  ) {
    return invalidInputResult();
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_reminder_with_assignees", {
    p_reminder_id: parsed.data.id,
    p_sector_id: parsed.data.sectorId,
    p_group_id: parsed.data.groupId,
    p_title: parsed.data.title,
    p_description: parsed.data.description,
    p_due_at: parsed.data.dueAt,
    p_due_all_day: parsed.data.dueAllDay,
    p_priority: parsed.data.priority,
    p_status: parsed.data.status,
    p_assignee_ids: parsed.data.assigneeIds,
  });

  if (error) {
    return databaseErrorResult(error);
  }

  revalidateDashboard();
  return { success: "Promemoria aggiornato." };
}

export async function updateReminderStatus(
  input: UpdateReminderStatusInput,
): Promise<ReminderActionResult> {
  const parsed = updateReminderStatusSchema.safeParse(input);
  if (!parsed.success || !(await canAccessSector(parsed.data.sectorId))) {
    return invalidInputResult();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reminders")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
    .eq("sector_id", parsed.data.sectorId)
    .select("id")
    .maybeSingle();

  if (error) {
    return databaseErrorResult(error);
  }
  if (!data) {
    return { error: "Il promemoria non è disponibile o non è autorizzato." };
  }

  revalidateDashboard();
  return {
    success: parsed.data.status === "COMPLETED" ? "Promemoria completato." : "Promemoria riaperto.",
  };
}

export async function updateReminderDue(
  input: UpdateReminderDueInput,
): Promise<ReminderActionResult> {
  const parsed = updateReminderDueSchema.safeParse(input);
  if (!parsed.success || !(await canAccessSector(parsed.data.sectorId))) {
    return invalidInputResult();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reminders")
    .update({ due_at: parsed.data.dueAt, due_all_day: parsed.data.dueAllDay })
    .eq("id", parsed.data.id)
    .eq("sector_id", parsed.data.sectorId)
    .eq("status", "OPEN")
    .select("id")
    .maybeSingle();

  if (error) {
    return databaseErrorResult(error);
  }
  if (!data) {
    return { error: "Il promemoria non è disponibile, è completato o non è autorizzato." };
  }

  revalidateDashboard();
  return { success: "Scadenza aggiornata." };
}

export async function deleteReminder(input: DeleteReminderInput): Promise<ReminderActionResult> {
  const parsed = deleteReminderSchema.safeParse(input);
  if (!parsed.success || !(await canAccessSector(parsed.data.sectorId))) {
    return invalidInputResult();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reminders")
    .delete()
    .eq("id", parsed.data.id)
    .eq("sector_id", parsed.data.sectorId)
    .select("id")
    .maybeSingle();

  if (error) {
    return databaseErrorResult(error);
  }
  if (!data) {
    return { error: "Il promemoria non è disponibile o non è autorizzato." };
  }

  revalidateDashboard();
  return { success: "Promemoria eliminato." };
}
