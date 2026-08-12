import { createClient } from "@/lib/supabase/server";

import { groupNodeDatabaseSchema, groupScopeRowSchema } from "./groups.schemas";
import type { GroupFilterContext, GroupNode } from "./groups.types";
import { getGroupNodePath } from "./groups.utils";

const groupNodeColumns =
  "id, sector_id, parent_id, name, node_type, sort_order, is_archived, created_at, updated_at";

function parseGroupNodes(data: unknown): readonly GroupNode[] {
  const parsed = groupNodeDatabaseSchema.array().safeParse(data);

  if (!parsed.success) {
    console.error("Group nodes response failed validation.", { issues: parsed.error.issues });
    throw new Error("La struttura dei gruppi restituita dal database non è valida.");
  }

  return parsed.data;
}

export async function getGroupNodes(
  sectorId: string,
  includeArchived = false,
): Promise<readonly GroupNode[]> {
  const supabase = await createClient();
  let query = supabase
    .from("group_nodes")
    .select(groupNodeColumns)
    .eq("sector_id", sectorId)
    .order("sort_order")
    .order("name");

  if (!includeArchived) {
    query = query.eq("is_archived", false);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Group nodes query failed.", { code: error.code, message: error.message });
    throw new Error("Impossibile caricare i gruppi del settore.");
  }

  return parseGroupNodes(data);
}

export async function resolveGroupFilter(
  sectorId: string,
  requestedGroupId: string | undefined,
): Promise<GroupFilterContext> {
  const nodes = await getGroupNodes(sectorId);
  const selectedNode = requestedGroupId
    ? (nodes.find((node) => node.id === requestedGroupId) ?? null)
    : null;

  if (!selectedNode) {
    return {
      nodes,
      selectedNode: null,
      selectedPath: [],
      scopeGroupIds: [],
      invalidSelection: Boolean(requestedGroupId),
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("resolve_group_scope", {
    selected_node_id: selectedNode.id,
  });

  if (error) {
    console.error("Group scope resolution failed.", { code: error.code, message: error.message });
    throw new Error("Impossibile risolvere il filtro dei gruppi.");
  }

  const parsedScope = groupScopeRowSchema.array().safeParse(data);
  if (!parsedScope.success) {
    console.error("Group scope response failed validation.", { issues: parsedScope.error.issues });
    throw new Error("Il filtro dei gruppi restituito dal database non è valido.");
  }

  return {
    nodes,
    selectedNode,
    selectedPath: getGroupNodePath(nodes, selectedNode),
    scopeGroupIds: parsedScope.data.map((scope) => scope.group_id),
    invalidSelection: false,
  };
}
