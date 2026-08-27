import { NextResponse } from "next/server";

import { getAuthenticatedContext } from "@/features/auth/auth.data";
import type { Sector } from "@/features/auth/auth.types";

type AuthorizedSector = Readonly<{ sector: Sector }>;
type UnauthorizedExport = Readonly<{ response: NextResponse }>;

export async function authorizeExportSector(
  sectorId: string,
): Promise<AuthorizedSector | UnauthorizedExport> {
  const context = await getAuthenticatedContext();
  if (!context) {
    return { response: NextResponse.json({ error: "Autenticazione richiesta." }, { status: 401 }) };
  }

  const sector = context.sectors.find((candidate) => candidate.id === sectorId);
  if (!sector) {
    return { response: NextResponse.json({ error: "Settore non autorizzato." }, { status: 403 }) };
  }

  return { sector };
}
