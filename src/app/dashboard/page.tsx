import { Container } from "@mantine/core";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { APP_CONFIG } from "@/config/app.config";
import { getAuthenticatedContext } from "@/features/auth/auth.data";
import { AccessNotConfigured } from "@/features/dashboard/AccessNotConfigured";
import { DashboardHeader } from "@/features/dashboard/DashboardHeader";
import { DashboardShell } from "@/features/dashboard/DashboardShell";
import { SectorSelector } from "@/features/dashboard/SectorSelector";
import { getGroupNodes, resolveGroupFilter } from "@/features/groups/groups.data";

export const metadata: Metadata = {
  title: `Dashboard | ${APP_CONFIG.name}`,
};

type DashboardPageProps = Readonly<{
  searchParams: Promise<{
    sector?: string | string[];
    selection?: string | string[];
    group?: string | string[];
    groupNotice?: string | string[];
  }>;
}>;

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const [context, query] = await Promise.all([getAuthenticatedContext(), searchParams]);

  if (!context) {
    redirect("/login");
  }

  const requestedSector = typeof query.sector === "string" ? query.sector : undefined;
  const requestedGroup = typeof query.group === "string" ? query.group : undefined;
  const sectorWasProvided = query.sector !== undefined;
  const selectionError = query.selection === "invalid";
  const groupNotice = query.groupNotice === "invalid";

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

    const [groupFilter, managementNodes] = await Promise.all([
      resolveGroupFilter(onlySector.id, requestedGroup),
      getGroupNodes(onlySector.id, true),
    ]);

    if (groupFilter.invalidSelection) {
      redirect(`/dashboard?sector=${onlySector.code}&groupNotice=invalid`);
    }

    return (
      <main className="dashboard-page">
        <DashboardHeader identity={context.identity} />
        <Container size="xl" py="lg">
          {groupNotice ? (
            <p className="dashboard-filter-notice" role="status">
              Il gruppo richiesto non è disponibile per questo settore. Il filtro è stato rimosso.
            </p>
          ) : null}
          <DashboardShell
            sectors={context.sectors}
            activeSector={onlySector}
            groupFilter={groupFilter}
            managementNodes={managementNodes}
          />
        </Container>
      </main>
    );
  }

  const activeSector = context.sectors.find((sector) => sector.code === requestedSector);

  if (sectorWasProvided && !activeSector) {
    redirect("/dashboard?selection=invalid");
  }

  if (activeSector) {
    const [groupFilter, managementNodes] = await Promise.all([
      resolveGroupFilter(activeSector.id, requestedGroup),
      getGroupNodes(activeSector.id, true),
    ]);

    if (groupFilter.invalidSelection) {
      redirect(`/dashboard?sector=${activeSector.code}&groupNotice=invalid`);
    }

    return (
      <main className="dashboard-page">
        <DashboardHeader identity={context.identity} />
        <Container size="xl" py="lg">
          {groupNotice ? (
            <p className="dashboard-filter-notice" role="status">
              Il gruppo richiesto non è disponibile per questo settore. Il filtro è stato rimosso.
            </p>
          ) : null}
          <DashboardShell
            sectors={context.sectors}
            activeSector={activeSector}
            groupFilter={groupFilter}
            managementNodes={managementNodes}
          />
        </Container>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <DashboardHeader identity={context.identity} />
      <Container size="xl" py="lg">
        <SectorSelector sectors={context.sectors} selectionError={selectionError} prominent />
      </Container>
    </main>
  );
}
