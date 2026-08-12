import { Container } from "@mantine/core";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { APP_CONFIG } from "@/config/app.config";
import { getAuthenticatedContext } from "@/features/auth/auth.data";
import { AccessNotConfigured } from "@/features/dashboard/AccessNotConfigured";
import { DashboardHeader } from "@/features/dashboard/DashboardHeader";
import { DashboardShell } from "@/features/dashboard/DashboardShell";
import { SectorSelector } from "@/features/dashboard/SectorSelector";

export const metadata: Metadata = {
  title: `Dashboard | ${APP_CONFIG.name}`,
};

type DashboardPageProps = Readonly<{
  searchParams: Promise<{
    sector?: string | string[];
    selection?: string | string[];
  }>;
}>;

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const [context, query] = await Promise.all([getAuthenticatedContext(), searchParams]);

  if (!context) {
    redirect("/login");
  }

  const requestedSector = typeof query.sector === "string" ? query.sector : undefined;
  const sectorWasProvided = query.sector !== undefined;
  const selectionError = query.selection === "invalid";

  if (context.status === "access-not-configured") {
    return (
      <main className="dashboard-page">
        <DashboardHeader identity={context.identity} />
        <Container size="xl" py={{ base: "xl", sm: 48 }}>
          <AccessNotConfigured profileConfigured={context.profileConfigured} />
        </Container>
      </main>
    );
  }

  if (context.sectors.length === 1) {
    const onlySector = context.sectors[0];

    if (!onlySector) {
      throw new Error("Il settore dell’utente non è disponibile.");
    }

    if (requestedSector !== onlySector.code || selectionError) {
      redirect(`/dashboard?sector=${onlySector.code}`);
    }

    return (
      <main className="dashboard-page">
        <DashboardHeader identity={context.identity} />
        <Container size="xl" py="lg">
          <DashboardShell sectors={context.sectors} activeSector={onlySector} />
        </Container>
      </main>
    );
  }

  const activeSector = context.sectors.find((sector) => sector.code === requestedSector);

  if (sectorWasProvided && !activeSector) {
    redirect("/dashboard?selection=invalid");
  }

  return (
    <main className="dashboard-page">
      <DashboardHeader identity={context.identity} />
      <Container size="xl" py="lg">
        {activeSector ? (
          <DashboardShell sectors={context.sectors} activeSector={activeSector} />
        ) : (
          <SectorSelector sectors={context.sectors} selectionError={selectionError} prominent />
        )}
      </Container>
    </main>
  );
}
