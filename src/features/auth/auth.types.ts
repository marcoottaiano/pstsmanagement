import { z } from "zod";

import { sectorSchema } from "./auth.schemas";

export type Sector = z.infer<typeof sectorSchema>;

export type AuthenticatedIdentity = Readonly<{
  id: string;
  email: string | null;
  displayName: string;
  initials: string;
}>;

type AuthenticatedContextBase = Readonly<{
  identity: AuthenticatedIdentity;
  sectors: readonly Sector[];
}>;

export type AuthenticatedContext =
  | (AuthenticatedContextBase & {
      status: "ready";
      profileConfigured: true;
    })
  | (AuthenticatedContextBase & {
      status: "sector-selection-required";
      profileConfigured: true;
    })
  | (AuthenticatedContextBase & {
      status: "access-not-configured";
      profileConfigured: boolean;
    });

export type LoginActionState = Readonly<{
  fieldErrors?: Readonly<{
    email?: string;
    password?: string;
  }>;
  formError?: string;
}>;

export type PasswordResetActionState = Readonly<{
  fieldErrors?: Readonly<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>;
  formError?: string;
  success?: string;
}>;
