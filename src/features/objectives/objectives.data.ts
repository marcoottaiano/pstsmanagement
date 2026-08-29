import { createClient } from "@/lib/supabase/server";

import { objectiveDatabaseSchema } from "./objectives.schemas";
import type { Objective } from "./objectives.types";

const objectiveColumns =
  "id, sector_id, group_id, title, description, status, completed_at, completed_late, period_start, period_end, created_by, created_at, updated_at";

export async function getObjectivesForScope(
  sectorId: string,
  scopedGroupIds: readonly string[] | null,
  groupNames: ReadonlyMap<string, string>,
): Promise<readonly Objective[]> {
  if (!scopedGroupIds || scopedGroupIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("objectives")
    .select(objectiveColumns)
    .eq("sector_id", sectorId)
    .in("group_id", [...scopedGroupIds])
    .order("status")
    .order("period_start", { ascending: true, nullsFirst: false })
    .order("title");

  if (error) {
    console.error("Objectives query failed.", { code: error.code, message: error.message });
    throw new Error("Impossibile caricare gli obiettivi.");
  }

  const parsed = objectiveDatabaseSchema.array().safeParse(data);
  if (!parsed.success) {
    console.error("Objectives response failed validation.", { issues: parsed.error.issues });
    throw new Error("Gli obiettivi restituiti dal database non sono validi.");
  }

  return parsed.data.map((objective) => ({
    ...objective,
    groupName: groupNames.get(objective.groupId) ?? "Gruppo non disponibile",
  }));
}
