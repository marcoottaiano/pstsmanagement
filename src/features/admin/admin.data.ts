import type { SupabaseClient, User } from "@supabase/supabase-js";

import { getAuthenticatedContext } from "@/features/auth/auth.data";
import { getFallbackDisplayName } from "@/features/auth/auth.utils";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database.types";

import {
  managedProfileSchema,
  managedSectorSchema,
  userDisplayMetadataSchema,
  userSectorMembershipSchema,
} from "./admin.schemas";
import type { AdminUsersPageData, ManagedUser, ManagedUserStatus } from "./admin.types";

const USERS_PER_PAGE = 1000;

async function listAllAuthUsers(adminClient: SupabaseClient<Database>): Promise<readonly User[]> {
  const users: User[] = [];

  for (let page = 1; ; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: USERS_PER_PAGE,
    });

    if (error) {
      console.error("Admin auth users query failed.", { message: error.message });
      throw new Error("Non è stato possibile caricare gli utenti.");
    }

    users.push(...data.users);
    if (data.users.length < USERS_PER_PAGE) {
      return users;
    }
  }
}

function getUserStatus(user: User): ManagedUserStatus {
  if (user.banned_until && new Date(user.banned_until).getTime() > Date.now()) {
    return "SUSPENDED";
  }

  return user.email_confirmed_at ? "ACTIVE" : "INVITED";
}

export async function getAdminUsersPageData(): Promise<AdminUsersPageData> {
  const context = await getAuthenticatedContext();
  if (!context?.isAdmin) {
    throw new Error("Accesso amministrativo richiesto.");
  }

  const adminClient = createAdminClient();
  const [authUsers, profilesResult, membershipsResult, sectorsResult] = await Promise.all([
    listAllAuthUsers(adminClient),
    adminClient.from("profiles").select("id, display_name, email, role"),
    adminClient.from("user_sectors").select("user_id, sector_id"),
    adminClient.from("sectors").select("id, code, name").order("code"),
  ]);

  const databaseError = profilesResult.error ?? membershipsResult.error ?? sectorsResult.error;
  if (databaseError) {
    console.error("Admin users database query failed.", {
      code: databaseError.code,
      message: databaseError.message,
    });
    throw new Error("Non è stato possibile caricare i dati degli utenti.");
  }

  const profiles = managedProfileSchema.array().safeParse(profilesResult.data);
  const memberships = userSectorMembershipSchema.array().safeParse(membershipsResult.data);
  const sectors = managedSectorSchema.array().safeParse(sectorsResult.data);

  if (!profiles.success || !memberships.success || !sectors.success) {
    console.error("Admin users response failed validation.", {
      profileIssues: profiles.error?.issues,
      membershipIssues: memberships.error?.issues,
      sectorIssues: sectors.error?.issues,
    });
    throw new Error("I dati degli utenti restituiti dal database non sono validi.");
  }

  const profilesById = new Map(profiles.data.map((profile) => [profile.id, profile]));
  const sectorIdsByUserId = new Map<string, string[]>();
  memberships.data.forEach((membership) => {
    const userSectorIds = sectorIdsByUserId.get(membership.user_id) ?? [];
    userSectorIds.push(membership.sector_id);
    sectorIdsByUserId.set(membership.user_id, userSectorIds);
  });

  const users: ManagedUser[] = authUsers
    .filter((user): user is User & { email: string } => Boolean(user.email))
    .map((user) => {
      const profile = profilesById.get(user.id);
      const metadata = userDisplayMetadataSchema.safeParse(user.user_metadata);
      const email = user.email.toLowerCase();

      return {
        id: user.id,
        email,
        displayName:
          profile?.display_name ??
          (metadata.success ? metadata.data.display_name : undefined) ??
          getFallbackDisplayName(email),
        role: profile?.role ?? "MEMBER",
        sectorIds: sectorIdsByUserId.get(user.id) ?? [],
        status: getUserStatus(user),
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at ?? null,
      };
    })
    .sort((first, second) => first.displayName.localeCompare(second.displayName, "it"));

  return { users, sectors: sectors.data };
}
