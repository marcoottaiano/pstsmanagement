"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedContext } from "@/features/auth/auth.data";
import { createClient } from "@/lib/supabase/server";

import {
  archiveGroupNodeSchema,
  createGroupNodeSchema,
  deleteGroupNodeSchema,
  moveGroupNodeSchema,
  renameGroupNodeSchema,
  reorderGroupNodeSchema,
} from "./groups.schemas";
import type {
  ArchiveGroupNodeInput,
  CreateGroupNodeInput,
  DeleteGroupNodeInput,
  GroupActionResult,
  MoveGroupNodeInput,
  RenameGroupNodeInput,
  ReorderGroupNodeInput,
} from "./groups.types";

function invalidInputResult(): GroupActionResult {
  return { error: "I dati inseriti non sono validi. Controlla i campi e riprova." };
}

function databaseErrorResult(error: { message: string; code?: string }): GroupActionResult {
  console.error("Group mutation failed.", { code: error.code, message: error.message });
  return { error: "Non è stato possibile salvare la modifica. Riprova." };
}

async function canManageSector(sectorId: string): Promise<boolean> {
  const context = await getAuthenticatedContext();
  return Boolean(context?.sectors.some((sector) => sector.id === sectorId));
}

function revalidateDashboard(): void {
  revalidatePath("/dashboard");
}

export async function createGroupNode(input: CreateGroupNodeInput): Promise<GroupActionResult> {
  const parsed = createGroupNodeSchema.safeParse(input);
  if (!parsed.success || !(await canManageSector(parsed.data.sectorId))) {
    return invalidInputResult();
  }

  const supabase = await createClient();
  let siblingsQuery = supabase
    .from("group_nodes")
    .select("sort_order")
    .eq("sector_id", parsed.data.sectorId)
    .eq("is_archived", false)
    .order("sort_order", { ascending: false })
    .limit(1);
  siblingsQuery = parsed.data.parentId
    ? siblingsQuery.eq("parent_id", parsed.data.parentId)
    : siblingsQuery.is("parent_id", null);
  const { data: lastSiblings, error: siblingError } = await siblingsQuery;

  if (siblingError) {
    return databaseErrorResult(siblingError);
  }

  const { error } = await supabase.from("group_nodes").insert({
    sector_id: parsed.data.sectorId,
    parent_id: parsed.data.parentId,
    name: parsed.data.name,
    node_type: parsed.data.nodeType,
    sort_order: (lastSiblings[0]?.sort_order ?? -1) + 1,
  });

  if (error) {
    return databaseErrorResult(error);
  }

  revalidateDashboard();
  return { success: "Nodo creato." };
}

export async function renameGroupNode(input: RenameGroupNodeInput): Promise<GroupActionResult> {
  const parsed = renameGroupNodeSchema.safeParse(input);
  if (!parsed.success || !(await canManageSector(parsed.data.sectorId))) {
    return invalidInputResult();
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("group_nodes")
    .update({ name: parsed.data.name })
    .eq("id", parsed.data.nodeId)
    .eq("sector_id", parsed.data.sectorId);

  if (error) {
    return databaseErrorResult(error);
  }

  revalidateDashboard();
  return { success: "Nome aggiornato." };
}

export async function moveGroupNode(input: MoveGroupNodeInput): Promise<GroupActionResult> {
  const parsed = moveGroupNodeSchema.safeParse(input);
  if (!parsed.success || !(await canManageSector(parsed.data.sectorId))) {
    return invalidInputResult();
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("group_nodes")
    .update({ parent_id: parsed.data.parentId })
    .eq("id", parsed.data.nodeId)
    .eq("sector_id", parsed.data.sectorId);

  if (error) {
    return databaseErrorResult(error);
  }

  revalidateDashboard();
  return { success: "Nodo spostato." };
}

export async function reorderGroupNode(input: ReorderGroupNodeInput): Promise<GroupActionResult> {
  const parsed = reorderGroupNodeSchema.safeParse(input);
  if (!parsed.success || !(await canManageSector(parsed.data.sectorId))) {
    return invalidInputResult();
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("reorder_group_node", {
    selected_node_id: parsed.data.nodeId,
    move_direction: parsed.data.direction,
  });

  if (error) {
    return databaseErrorResult(error);
  }

  revalidateDashboard();
  return { success: "Ordine aggiornato." };
}

export async function setGroupSubtreeArchiveState(
  input: ArchiveGroupNodeInput,
): Promise<GroupActionResult> {
  const parsed = archiveGroupNodeSchema.safeParse(input);
  if (!parsed.success || !(await canManageSector(parsed.data.sectorId))) {
    return invalidInputResult();
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_group_subtree_archive_state", {
    selected_node_id: parsed.data.nodeId,
    archived: parsed.data.archived,
  });

  if (error) {
    return databaseErrorResult(error);
  }

  revalidateDashboard();
  return {
    success: parsed.data.archived ? "Sottoalbero archiviato." : "Sottoalbero ripristinato.",
  };
}

export async function deleteGroupNode(input: DeleteGroupNodeInput): Promise<GroupActionResult> {
  const parsed = deleteGroupNodeSchema.safeParse(input);
  if (!parsed.success || !(await canManageSector(parsed.data.sectorId))) {
    return invalidInputResult();
  }

  const supabase = await createClient();
  const [children, scheduledWork, reminders, objectives] = await Promise.all([
    supabase
      .from("group_nodes")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", parsed.data.nodeId),
    supabase
      .from("scheduled_work")
      .select("id", { count: "exact", head: true })
      .eq("group_id", parsed.data.nodeId),
    supabase
      .from("reminders")
      .select("id", { count: "exact", head: true })
      .eq("group_id", parsed.data.nodeId),
    supabase
      .from("objectives")
      .select("id", { count: "exact", head: true })
      .eq("group_id", parsed.data.nodeId),
  ]);

  const readError = children.error ?? scheduledWork.error ?? reminders.error ?? objectives.error;
  if (readError) {
    return databaseErrorResult(readError);
  }

  if (
    (children.count ?? 0) > 0 ||
    (scheduledWork.count ?? 0) > 0 ||
    (reminders.count ?? 0) > 0 ||
    (objectives.count ?? 0) > 0
  ) {
    return { error: "Il nodo contiene figli o dati storici e può essere soltanto archiviato." };
  }

  const { error } = await supabase
    .from("group_nodes")
    .delete()
    .eq("id", parsed.data.nodeId)
    .eq("sector_id", parsed.data.sectorId);

  if (error) {
    return databaseErrorResult(error);
  }

  revalidateDashboard();
  return { success: "Nodo eliminato." };
}
