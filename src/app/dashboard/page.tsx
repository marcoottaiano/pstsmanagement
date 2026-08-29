import { Container } from "@mantine/core";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { APP_CONFIG } from "@/config/app.config";
import { getAuthenticatedContext } from "@/features/auth/auth.data";
import { AccessNotConfigured } from "@/features/dashboard/AccessNotConfigured";
import { getDashboardData } from "@/features/dashboard/dashboard.data";
import { DashboardHeader } from "@/features/dashboard/DashboardHeader";
import { DashboardShell } from "@/features/dashboard/DashboardShell";
import { getGroupNodes } from "@/features/groups/groups.data";
import type { GroupFilterContext } from "@/features/groups/groups.types";
import { getTodayInRome } from "@/features/scheduled-work/scheduled-work.dates";

export const metadata: Metadata = {
  title: APP_CONFIG.name,
};

type DashboardPageProps = Readonly<{
  searchParams: Promise<{
    sector?: string | string[];
    selection?: string | string[];
  }>;
}>;

function getReadyDashboardUrl(sectorCode: string): string {
  return `/dashboard?sector=${sectorCode}`;
}

function createEmptyGroupFilter(nodes: GroupFilterContext["nodes"]): GroupFilterContext {
  return {
    nodes,
    selectedNode: null,
    selectedPath: [],
    scopeGroupIds: [],
    invalidSelection: false,
  };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const [context, query] = await Promise.all([getAuthenticatedContext(), searchParams]);

  if (!context) {
    redirect("/login");
  }

  const requestedSector = typeof query.sector === "string" ? query.sector : undefined;
  const calendarDate = getTodayInRome();
  const sectorWasProvided = query.sector !== undefined;
  const selectionError = query.selection === "invalid";

  if (context.status === "access-not-configured") {
    return (
      <main className="dashboard-page">
        <DashboardHeader identity={context.identity} isAdmin={context.isAdmin} />
        <Container className="dashboard-content" py={{ base: "xl", sm: 48 }}>
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
      redirect(getReadyDashboardUrl(onlySector.code));
    }

    const [nodes, managementNodes] = await Promise.all([
      getGroupNodes(onlySector.id),
      getGroupNodes(onlySector.id, true),
    ]);
    const groupFilter = createEmptyGroupFilter(nodes);
    const { selectableGroups, scheduledWork, reminders, assigneeOptions, objectives } =
      await getDashboardData(onlySector, nodes, calendarDate);

    return (
      <main className={`dashboard-page dashboard-page-${onlySector.code}`}>
        <DashboardHeader identity={context.identity} isAdmin={context.isAdmin} />
        <Container className="dashboard-content" py="lg">
          <DashboardShell
            key={onlySector.id}
            activeSector={onlySector}
            groupFilter={groupFilter}
            managementNodes={managementNodes}
            selectableGroups={selectableGroups}
            scheduledWork={scheduledWork}
            reminders={reminders}
            objectives={objectives}
            assigneeOptions={assigneeOptions}
            currentUserId={context.identity.id}
            calendarDate={calendarDate}
          />
        </Container>
      </main>
    );
  }

  const activeSector = context.sectors.find((sector) => sector.code === requestedSector);

  if (!sectorWasProvided) {
    const defaultSector =
      context.sectors.find((sector) => sector.code === "artistic") ?? context.sectors[0];

    if (!defaultSector) {
      throw new Error("Nessun settore disponibile per l’utente.");
    }

    redirect(getReadyDashboardUrl(defaultSector.code));
  }

  if (sectorWasProvided && !activeSector) {
    redirect("/dashboard?selection=invalid");
  }

  if (activeSector) {
    const [nodes, managementNodes] = await Promise.all([
      getGroupNodes(activeSector.id),
      getGroupNodes(activeSector.id, true),
    ]);
    const groupFilter = createEmptyGroupFilter(nodes);
    const { selectableGroups, scheduledWork, reminders, assigneeOptions, objectives } =
      await getDashboardData(activeSector, nodes, calendarDate);

    return (
      <main className={`dashboard-page dashboard-page-${activeSector.code}`}>
        <DashboardHeader
          identity={context.identity}
          isAdmin={context.isAdmin}
          sectors={context.sectors}
          activeSector={activeSector}
        />
        <Container className="dashboard-content" py="lg">
          <DashboardShell
            key={activeSector.id}
            activeSector={activeSector}
            groupFilter={groupFilter}
            managementNodes={managementNodes}
            selectableGroups={selectableGroups}
            scheduledWork={scheduledWork}
            reminders={reminders}
            objectives={objectives}
            assigneeOptions={assigneeOptions}
            currentUserId={context.identity.id}
            calendarDate={calendarDate}
          />
        </Container>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <DashboardHeader
        identity={context.identity}
        isAdmin={context.isAdmin}
        sectors={context.sectors}
      />
      {selectionError ? (
        <Container className="dashboard-content" py="lg">
          <p className="dashboard-filter-notice" role="alert">
            Il settore richiesto non è disponibile per il tuo account. Selezionane uno autorizzato.
          </p>
        </Container>
      ) : null}
    </main>
  );
}
