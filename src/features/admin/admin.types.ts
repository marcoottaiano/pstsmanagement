import type { Sector } from "@/features/auth/auth.types";

export type ManagedUserStatus = "ACTIVE" | "INVITED" | "SUSPENDED";

export type ManagedUser = Readonly<{
  id: string;
  email: string;
  displayName: string;
  role: "ADMIN" | "MEMBER";
  sectorIds: readonly string[];
  status: ManagedUserStatus;
  createdAt: string;
  lastSignInAt: string | null;
}>;

export type AdminUsersPageData = Readonly<{
  users: readonly ManagedUser[];
  sectors: readonly Sector[];
}>;

export type AdminActionResult = Readonly<{
  error?: string;
  success?: string;
}>;

export type InviteUserInput = Readonly<{
  displayName: string;
  email: string;
  sectorIds: readonly string[];
}>;

export type SetUserSectorAccessInput = Readonly<{
  userId: string;
  sectorIds: readonly string[];
}>;

export type DeleteUserInput = Readonly<{
  userId: string;
}>;
