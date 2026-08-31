"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedContext } from "@/features/auth/auth.data";
import { createClient } from "@/lib/supabase/server";

import {
  createScheduledWorkSchema,
  deleteScheduledWorkSchema,
  updateScheduledWorkDatesSchema,
  updateScheduledWorkSchema,
} from "./scheduled-work.schemas";
import type {
  CreateScheduledWorkInput,
  DeleteScheduledWorkInput,
  ScheduledWorkActionResult,
  UpdateScheduledWorkDatesInput,
  UpdateScheduledWorkInput,
} from "./scheduled-work.types";

function invalidInputResult(): ScheduledWorkActionResult {
  return { error: "I dati inseriti non sono validi. Controlla i campi e riprova." };
}

function databaseErrorResult(error: { message: string; code?: string }): ScheduledWorkActionResult {
  console.error("Scheduled work mutation failed.", { code: error.code, message: error.message });
  return { error: "Non è stato possibile salvare la modifica. Riprova." };
}

async function canAccessSector(sectorId: string): Promise<boolean> {
  const context = await getAuthenticatedContext();
  return Boolean(context?.sectors.some((sector) => sector.id === sectorId));
}

async function areActiveGroupsInSector(
  sectorId: string,
  groupIds: readonly string[],
  scheduledWorkId?: string,
): Promise<boolean> {
  if (groupIds.length === 0) {
    return false;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("group_nodes")
    .select("id")
    .eq("sector_id", sectorId)
    .eq("is_archived", false)
    .in("id", [...groupIds]);

  if (error) {
    console.error("Scheduled work group validation failed.", {
      code: error.code,
      message: error.message,
    });
    return false;
  }

  const allowedGroupIds = new Set(data.map((group) => group.id));
  if (scheduledWorkId && allowedGroupIds.size < groupIds.length) {
    const { data: existingGroups, error: existingGroupsError } = await supabase
      .from("scheduled_work_groups")
      .select("group_id")
      .eq("scheduled_work_id", scheduledWorkId)
      .in("group_id", [...groupIds]);

    if (existingGroupsError) {
      return false;
    }
    for (const existingGroup of existingGroups) {
      allowedGroupIds.add(existingGroup.group_id);
    }
  }

  return allowedGroupIds.size === groupIds.length;
}

async function canMutateWork(
  sectorId: string,
  groupIds?: readonly string[],
  scheduledWorkId?: string,
): Promise<boolean> {
  if (!(await canAccessSector(sectorId))) {
    return false;
  }

  return groupIds ? areActiveGroupsInSector(sectorId, groupIds, scheduledWorkId) : true;
}

function revalidateDashboard(): void {
  revalidatePath("/dashboard");
}

export async function createScheduledWork(
  input: CreateScheduledWorkInput,
): Promise<ScheduledWorkActionResult> {
  const parsed = createScheduledWorkSchema.safeParse(input);
  if (!parsed.success || !(await canMutateWork(parsed.data.sectorId, parsed.data.groupIds))) {
    return invalidInputResult();
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_scheduled_work_with_groups", {
    p_sector_id: parsed.data.sectorId,
    p_group_ids: parsed.data.groupIds,
    p_title: parsed.data.title,
    p_description: parsed.data.description,
    p_start_at: parsed.data.startAt,
    p_end_at: parsed.data.endAt,
    p_all_day: parsed.data.allDay,
  });

  if (error) {
    return databaseErrorResult(error);
  }

  revalidateDashboard();
  return { success: "Lavoro programmato creato." };
}

export async function updateScheduledWork(
  input: UpdateScheduledWorkInput,
): Promise<ScheduledWorkActionResult> {
  const parsed = updateScheduledWorkSchema.safeParse(input);
  if (
    !parsed.success ||
    !(await canMutateWork(parsed.data.sectorId, parsed.data.groupIds, parsed.data.id))
  ) {
    return invalidInputResult();
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_scheduled_work_with_groups", {
    p_scheduled_work_id: parsed.data.id,
    p_sector_id: parsed.data.sectorId,
    p_group_ids: parsed.data.groupIds,
    p_title: parsed.data.title,
    p_description: parsed.data.description,
    p_start_at: parsed.data.startAt,
    p_end_at: parsed.data.endAt,
    p_all_day: parsed.data.allDay,
  });

  if (error) {
    return databaseErrorResult(error);
  }
  revalidateDashboard();
  return { success: "Lavoro programmato aggiornato." };
}

export async function deleteScheduledWork(
  input: DeleteScheduledWorkInput,
): Promise<ScheduledWorkActionResult> {
  const parsed = deleteScheduledWorkSchema.safeParse(input);
  if (!parsed.success || !(await canMutateWork(parsed.data.sectorId))) {
    return invalidInputResult();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scheduled_work")
    .delete()
    .eq("id", parsed.data.id)
    .eq("sector_id", parsed.data.sectorId)
    .select("id")
    .maybeSingle();

  if (error) {
    return databaseErrorResult(error);
  }
  if (!data) {
    return { error: "Il lavoro programmato non è disponibile o non è autorizzato." };
  }

  revalidateDashboard();
  return { success: "Lavoro programmato eliminato." };
}

export async function updateScheduledWorkDates(
  input: UpdateScheduledWorkDatesInput,
): Promise<ScheduledWorkActionResult> {
  const parsed = updateScheduledWorkDatesSchema.safeParse(input);
  if (!parsed.success || !(await canMutateWork(parsed.data.sectorId))) {
    return invalidInputResult();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scheduled_work")
    .update({
      start_at: parsed.data.startAt,
      end_at: parsed.data.endAt,
      all_day: parsed.data.allDay,
    })
    .eq("id", parsed.data.id)
    .eq("sector_id", parsed.data.sectorId)
    .select("id")
    .maybeSingle();

  if (error) {
    return databaseErrorResult(error);
  }
  if (!data) {
    return { error: "Il lavoro programmato non è disponibile o non è autorizzato." };
  }

  revalidateDashboard();
  return { success: "Date del lavoro aggiornate." };
}
