"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedContext } from "@/features/auth/auth.data";
import { createClient } from "@/lib/supabase/server";

import {
  createObjectiveSchema,
  deleteObjectiveSchema,
  objectiveStatusSchema,
  updateObjectiveSchema,
  updateObjectiveStatusSchema,
} from "./objectives.schemas";
import type {
  CreateObjectiveInput,
  DeleteObjectiveInput,
  ObjectiveActionResult,
  UpdateObjectiveInput,
  UpdateObjectiveStatusInput,
} from "./objectives.types";

function invalidInputResult(): ObjectiveActionResult {
  return { error: "I dati inseriti non sono validi. Controlla i campi e riprova." };
}

function databaseErrorResult(error: { message: string; code?: string }): ObjectiveActionResult {
  console.error("Objective mutation failed.", { code: error.code, message: error.message });
  return { error: "Non è stato possibile salvare l'obiettivo. Riprova." };
}

async function canAccessSector(sectorId: string): Promise<boolean> {
  const context = await getAuthenticatedContext();
  return Boolean(context?.sectors.some((sector) => sector.id === sectorId));
}

async function isActiveGroupInSector(sectorId: string, groupId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("group_nodes")
    .select("id")
    .eq("id", groupId)
    .eq("sector_id", sectorId)
    .eq("is_archived", false)
    .maybeSingle();

  return !error && data !== null;
}

async function canSaveObjective(sectorId: string, groupId: string): Promise<boolean> {
  return (await canAccessSector(sectorId)) && (await isActiveGroupInSector(sectorId, groupId));
}

function revalidateDashboard(): void {
  revalidatePath("/dashboard");
}

export async function createObjective(input: CreateObjectiveInput): Promise<ObjectiveActionResult> {
  const parsed = createObjectiveSchema.safeParse(input);
  if (!parsed.success || !(await canSaveObjective(parsed.data.sectorId, parsed.data.groupId))) {
    return invalidInputResult();
  }

  const supabase = await createClient();
  const { error } = await supabase.from("objectives").insert({
    sector_id: parsed.data.sectorId,
    group_id: parsed.data.groupId,
    title: parsed.data.title,
    description: parsed.data.description,
    period_start: parsed.data.periodStart,
    period_end: parsed.data.periodEnd,
  });

  if (error) {
    return databaseErrorResult(error);
  }

  revalidateDashboard();
  return { success: "Obiettivo creato." };
}

export async function updateObjective(input: UpdateObjectiveInput): Promise<ObjectiveActionResult> {
  const parsed = updateObjectiveSchema.safeParse(input);
  if (!parsed.success || !(await canSaveObjective(parsed.data.sectorId, parsed.data.groupId))) {
    return invalidInputResult();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("objectives")
    .update({
      group_id: parsed.data.groupId,
      title: parsed.data.title,
      description: parsed.data.description,
      period_start: parsed.data.periodStart,
      period_end: parsed.data.periodEnd,
    })
    .eq("id", parsed.data.id)
    .eq("sector_id", parsed.data.sectorId)
    .select("id")
    .maybeSingle();

  if (error) {
    return databaseErrorResult(error);
  }
  if (!data) {
    return { error: "L'obiettivo non è disponibile o non è autorizzato." };
  }

  revalidateDashboard();
  return { success: "Obiettivo aggiornato." };
}

export async function updateObjectiveStatus(
  input: UpdateObjectiveStatusInput,
): Promise<ObjectiveActionResult> {
  const parsed = updateObjectiveStatusSchema.safeParse(input);
  if (!parsed.success || !(await canAccessSector(parsed.data.sectorId))) {
    return invalidInputResult();
  }

  const supabase = await createClient();
  const { data: currentObjective, error: currentObjectiveError } = await supabase
    .from("objectives")
    .select("status")
    .eq("id", parsed.data.id)
    .eq("sector_id", parsed.data.sectorId)
    .maybeSingle();

  if (currentObjectiveError) {
    return databaseErrorResult(currentObjectiveError);
  }
  if (!currentObjective) {
    return { error: "L'obiettivo non è disponibile o non è autorizzato." };
  }

  const currentStatus = objectiveStatusSchema.safeParse(currentObjective.status);
  if (!currentStatus.success) {
    return { error: "Lo stato attuale dell'obiettivo non è valido." };
  }

  const validTransition =
    (currentStatus.data === "NOT_STARTED" && parsed.data.status === "IN_PROGRESS") ||
    (currentStatus.data === "IN_PROGRESS" && parsed.data.status === "COMPLETED") ||
    (currentStatus.data === "COMPLETED" && parsed.data.status === "IN_PROGRESS");
  if (!validTransition) {
    return { error: "Il passaggio di stato richiesto non è consentito." };
  }

  const { data, error } = await supabase
    .from("objectives")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
    .eq("sector_id", parsed.data.sectorId)
    .eq("status", currentStatus.data)
    .select("id")
    .maybeSingle();

  if (error) {
    return databaseErrorResult(error);
  }
  if (!data) {
    return { error: "L'obiettivo non è disponibile o non è autorizzato." };
  }

  revalidateDashboard();
  const success =
    parsed.data.status === "IN_PROGRESS"
      ? currentStatus.data === "COMPLETED"
        ? "Obiettivo riaperto."
        : "Obiettivo avviato."
      : "Obiettivo completato.";
  return { success };
}

export async function deleteObjective(input: DeleteObjectiveInput): Promise<ObjectiveActionResult> {
  const parsed = deleteObjectiveSchema.safeParse(input);
  if (!parsed.success || !(await canAccessSector(parsed.data.sectorId))) {
    return invalidInputResult();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("objectives")
    .delete()
    .eq("id", parsed.data.id)
    .eq("sector_id", parsed.data.sectorId)
    .select("id")
    .maybeSingle();

  if (error) {
    return databaseErrorResult(error);
  }
  if (!data) {
    return { error: "L'obiettivo non è disponibile o non è autorizzato." };
  }

  revalidateDashboard();
  return { success: "Obiettivo eliminato." };
}
