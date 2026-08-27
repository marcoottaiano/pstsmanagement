import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

import { authClaimsSchema, profileSchema, sectorSchema } from "./auth.schemas";
import type { AuthenticatedContext } from "./auth.types";
import { getFallbackDisplayName, getInitials } from "./auth.utils";

const JWT_CLOCK_SKEW_RETRY_DELAY_MS = 1_000;

type QueryError = Readonly<{
  code?: string;
  message?: string;
}>;

function isJwtIssuedAtFutureError(error: QueryError | null): boolean {
  return (
    error?.code === "PGRST303" &&
    error.message?.toLocaleLowerCase("en-US").includes("jwt issued at future") === true
  );
}

async function waitForJwtClockSkew(): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, JWT_CLOCK_SKEW_RETRY_DELAY_MS);
  });
}

export const getAuthenticatedContext = cache(async (): Promise<AuthenticatedContext | null> => {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claimsResult = authClaimsSchema.safeParse(claimsData?.claims);

  if (claimsError || !claimsResult.success) {
    return null;
  }

  const { sub: userId, email: claimEmail } = claimsResult.data;
  let [profileResult, sectorsResult] = await Promise.all([
    supabase.from("profiles").select("display_name, email, role").eq("id", userId).maybeSingle(),
    supabase.from("sectors").select("id, code, name").order("code"),
  ]);

  if (
    isJwtIssuedAtFutureError(profileResult.error) ||
    isJwtIssuedAtFutureError(sectorsResult.error)
  ) {
    console.warn("Supabase rejected a newly issued JWT because of clock skew. Retrying once.", {
      retryDelayMs: JWT_CLOCK_SKEW_RETRY_DELAY_MS,
    });
    await waitForJwtClockSkew();
    [profileResult, sectorsResult] = await Promise.all([
      supabase.from("profiles").select("display_name, email, role").eq("id", userId).maybeSingle(),
      supabase.from("sectors").select("id, code, name").order("code"),
    ]);
  }

  if (profileResult.error || sectorsResult.error) {
    console.error("Dashboard authentication context query failed.", {
      profileError: profileResult.error?.message,
      profileErrorCode: profileResult.error?.code,
      sectorsError: sectorsResult.error?.message,
      sectorsErrorCode: sectorsResult.error?.code,
    });

    throw new Error("Impossibile caricare il profilo autenticato.");
  }

  const sectorsResultParsed = sectorSchema.array().safeParse(sectorsResult.data);
  if (!sectorsResultParsed.success) {
    console.error("Dashboard sectors response failed validation.", {
      issues: sectorsResultParsed.error.issues,
    });

    throw new Error("I settori restituiti dal database non sono validi.");
  }

  const parsedProfile = profileResult.data ? profileSchema.safeParse(profileResult.data) : null;
  if (parsedProfile && !parsedProfile.success) {
    console.error("Dashboard profile response failed validation.", {
      issues: parsedProfile.error.issues,
    });
    throw new Error("Il profilo restituito dal database non è valido.");
  }

  const profile = parsedProfile?.data;
  const email = profile?.email ?? claimEmail ?? null;
  const displayName = profile?.display_name ?? getFallbackDisplayName(email);
  const sectors = sectorsResultParsed.data;
  const identity = {
    id: userId,
    email,
    displayName,
    initials: getInitials(displayName),
  };

  if (!profile || sectors.length === 0) {
    return {
      status: "access-not-configured",
      profileConfigured: Boolean(profile),
      identity,
      isAdmin: profile?.role === "ADMIN",
      sectors,
    };
  }

  return {
    status: sectors.length === 1 ? "ready" : "sector-selection-required",
    profileConfigured: true,
    identity,
    isAdmin: profile.role === "ADMIN",
    sectors,
  };
});
