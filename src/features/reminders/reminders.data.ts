import {
  DEFAULT_USER_AVATAR_BACKGROUND,
  DEFAULT_USER_AVATAR_STYLE,
  getDefaultAvatarSeed,
  isUserAvatarBackground,
  isUserAvatarStyle,
} from "@/features/avatar/avatar";
import { getInitials } from "@/features/auth/auth.utils";
import { createClient } from "@/lib/supabase/server";

import {
  reminderAssigneeRowSchema,
  reminderDatabaseSchema,
  reminderProfileSchema,
} from "./reminders.schemas";
import type { Reminder, ReminderPerson } from "./reminders.types";

const reminderColumns =
  "id, sector_id, group_id, title, description, due_at, due_all_day, status, completed_at, completed_late, priority, created_by, created_at, updated_at";

function databaseReadError(label: string, error: { code?: string; message: string }): never {
  console.error(`${label} query failed.`, { code: error.code, message: error.message });
  throw new Error("Impossibile caricare i promemoria.");
}

function toReminderPerson(profile: {
  id: string;
  display_name: string;
  email: string | null;
  avatar_background: string | null;
  avatar_style: string | null;
  avatar_seed: string | null;
}): ReminderPerson {
  const avatarStyle = profile.avatar_style ?? DEFAULT_USER_AVATAR_STYLE;
  const avatarBackground = profile.avatar_background ?? DEFAULT_USER_AVATAR_BACKGROUND;

  return {
    id: profile.id,
    displayName: profile.display_name,
    email: profile.email,
    initials: getInitials(profile.display_name),
    avatar: {
      style: isUserAvatarStyle(avatarStyle) ? avatarStyle : DEFAULT_USER_AVATAR_STYLE,
      seed: profile.avatar_seed || getDefaultAvatarSeed(profile.display_name, profile.email),
      background: isUserAvatarBackground(avatarBackground)
        ? avatarBackground
        : DEFAULT_USER_AVATAR_BACKGROUND,
    },
  };
}

export async function getReminderAssigneeOptions(
  sectorId: string,
): Promise<readonly ReminderPerson[]> {
  const supabase = await createClient();
  const { data: memberships, error: membershipError } = await supabase
    .from("user_sectors")
    .select("user_id")
    .eq("sector_id", sectorId);

  if (membershipError) {
    databaseReadError("Reminder memberships", membershipError);
  }

  const userIds = memberships.map((membership) => membership.user_id);
  if (userIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, email, avatar_style, avatar_seed, avatar_background")
    .in("id", userIds)
    .order("display_name");

  if (error) {
    databaseReadError("Reminder assignee profiles", error);
  }

  const parsed = reminderProfileSchema.array().safeParse(data);
  if (!parsed.success) {
    console.error("Reminder assignee profiles failed validation.", { issues: parsed.error.issues });
    throw new Error("Gli utenti assegnabili restituiti dal database non sono validi.");
  }

  return parsed.data.map(toReminderPerson);
}

export async function getVisibleReminders(
  sectorId: string,
  scopedGroupIds: readonly string[] | null,
  nodeNames: ReadonlyMap<string, string>,
): Promise<readonly Reminder[]> {
  const supabase = await createClient();
  let query = supabase.from("reminders").select(reminderColumns).eq("sector_id", sectorId);

  if (scopedGroupIds) {
    query =
      scopedGroupIds.length === 0
        ? query.is("group_id", null)
        : query.or(`group_id.is.null,group_id.in.(${scopedGroupIds.join(",")})`);
  }

  const { data, error } = await query.order("due_at", { ascending: true, nullsFirst: false });
  if (error) {
    databaseReadError("Reminders", error);
  }

  const parsedReminders = reminderDatabaseSchema.array().safeParse(data);
  if (!parsedReminders.success) {
    console.error("Reminders response failed validation.", {
      issues: parsedReminders.error.issues,
    });
    throw new Error("I promemoria restituiti dal database non sono validi.");
  }

  const reminderIds = parsedReminders.data.map((reminder) => reminder.id);
  if (reminderIds.length === 0) {
    return [];
  }

  const { data: assigneeRows, error: assigneeError } = await supabase
    .from("reminder_assignees")
    .select("reminder_id, user_id")
    .in("reminder_id", reminderIds);

  if (assigneeError) {
    databaseReadError("Reminder assignees", assigneeError);
  }

  const parsedAssignees = reminderAssigneeRowSchema.array().safeParse(assigneeRows);
  if (!parsedAssignees.success) {
    console.error("Reminder assignees failed validation.", {
      issues: parsedAssignees.error.issues,
    });
    throw new Error("Gli assegnatari restituiti dal database non sono validi.");
  }

  const profileIds = [...new Set(parsedAssignees.data.map((row) => row.user_id))];
  const profilesById = new Map<string, ReminderPerson>();

  if (profileIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name, email, avatar_style, avatar_seed, avatar_background")
      .in("id", profileIds);

    if (profilesError) {
      databaseReadError("Reminder profiles", profilesError);
    }

    const parsedProfiles = reminderProfileSchema.array().safeParse(profiles);
    if (!parsedProfiles.success) {
      console.error("Reminder profiles failed validation.", {
        issues: parsedProfiles.error.issues,
      });
      throw new Error("I profili restituiti dal database non sono validi.");
    }

    for (const profile of parsedProfiles.data) {
      profilesById.set(profile.id, toReminderPerson(profile));
    }
  }

  const assigneesByReminder = new Map<string, ReminderPerson[]>();
  for (const row of parsedAssignees.data) {
    const profile = profilesById.get(row.user_id);
    if (!profile) {
      continue;
    }
    const assignees = assigneesByReminder.get(row.reminder_id) ?? [];
    assignees.push(profile);
    assigneesByReminder.set(row.reminder_id, assignees);
  }

  return parsedReminders.data.map((reminder) => ({
    ...reminder,
    groupName: reminder.groupId
      ? (nodeNames.get(reminder.groupId) ?? "Voce della struttura")
      : null,
    assignees: assigneesByReminder.get(reminder.id) ?? [],
  }));
}
