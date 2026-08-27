import type { AuthenticatedIdentity } from "@/features/auth/auth.types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, TablesInsert } from "@/types/database.types";

type UserActivityAction = "INVITED" | "ACCESS_UPDATED" | "USER_DELETED";

type RecordUserActivityInput = Readonly<{
  actor: AuthenticatedIdentity;
  action: UserActivityAction;
  targetUserId: string;
  targetDisplayName: string;
  metadata?: Readonly<Record<string, Json>>;
}>;

export async function recordUserManagementActivity(input: RecordUserActivityInput): Promise<void> {
  const activity: TablesInsert<"activity_log"> = {
    actor_id: input.actor.id,
    actor_name: input.actor.displayName,
    actor_email: input.actor.email,
    action: input.action,
    entity_type: "USER",
    entity_id: input.targetUserId,
    entity_title: input.targetDisplayName,
    metadata: input.metadata ?? {},
  };
  const { error } = await createAdminClient().from("activity_log").insert(activity);

  if (error) {
    console.error("User management activity logging failed.", {
      action: input.action,
      code: error.code,
      message: error.message,
      targetUserId: input.targetUserId,
    });
  }
}
