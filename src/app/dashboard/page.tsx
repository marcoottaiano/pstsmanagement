import { Container } from "@mantine/core";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { APP_CONFIG } from "@/config/app.config";
import { getAuthenticatedContext } from "@/features/auth/auth.data";
import type { Sector } from "@/features/auth/auth.types";
import { AccessNotConfigured } from "@/features/dashboard/AccessNotConfigured";
import { DashboardHeader } from "@/features/dashboard/DashboardHeader";
import { DashboardShell } from "@/features/dashboard/DashboardShell";
import { SectorSelector } from "@/features/dashboard/SectorSelector";
import { getGroupNodes, resolveGroupFilter } from "@/features/groups/groups.data";
import type { GroupFilterContext, GroupNode } from "@/features/groups/groups.types";
import {
  getReminderAssigneeOptions,
  getVisibleReminders,
} from "@/features/reminders/reminders.data";
import { getScheduledWorkForVisibleRange } from "@/features/scheduled-work/scheduled-work.data";
import {
  getTodayInRome,
  getVisibleMonthRange,
  isValidCalendarDate,
} from "@/features/scheduled-work/scheduled-work.dates";

export const metadata: Metadata = {
  title: `Dashboard | ${APP_CONFIG.name}`,
};

type DashboardPageProps = Readonly<{
  searchParams: Promise<{
    sector?: string | string[];
    selection?: string | string[];
    group?: string | string[];
    groupNotice?: string | string[];
    date?: string | string[];
  }>;
}>;

async function getDashboardData(
  sector: Sector,
  groupFilter: GroupFilterContext,
  calendarDate: string,
) {
  const selectableGroups = groupFilter.nodes.filter(
    (node): node is GroupNode =>
      node.nodeType === "GROUP" &&
      (!groupFilter.selectedNode || groupFilter.scopeGroupIds.includes(node.id)),
  );
  const range = getVisibleMonthRange(calendarDate);
  const groupNames = new Map(
    groupFilter.nodes
      .filter((node) => node.nodeType === "GROUP")
      .map((group) => [group.id, group.name]),
  );
  const [scheduledWork, reminders, assigneeOptions] = await Promise.all([
    getScheduledWorkForVisibleRange(
      sector.id,
      selectableGroups.map((group) => group.id),
      range.startAt,
      range.endAt,
      groupNames,
    ),
    getVisibleReminders(
      sector.id,
      groupFilter.selectedNode ? groupFilter.scopeGroupIds : null,
      groupNames,
    ),
    getReminderAssigneeOptions(sector.id),
  ]);

  return { selectableGroups, scheduledWork, reminders, assigneeOptions };
}

function getReadyDashboardUrl(sectorCode: string, calendarDate: string, groupId?: string): string {
  const params = new URLSearchParams({ sector: sectorCode, date: calendarDate });
  if (groupId) {
    params.set("group", groupId);
  }
  return `/dashboard?${params.toString()}`;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const [context, query] = await Promise.all([getAuthenticatedContext(), searchParams]);

  if (!context) {
    redirect("/login");
  }

  const requestedSector = typeof query.sector === "string" ? query.sector : undefined;
  const requestedGroup = typeof query.group === "string" ? query.group : undefined;
  const requestedDate = typeof query.date === "string" ? query.date : undefined;
  const calendarDate = isValidCalendarDate(requestedDate) ? requestedDate : getTodayInRome();
  const dateNeedsCanonicalization = requestedDate !== calendarDate;
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
      redirect(getReadyDashboardUrl(onlySector.code, calendarDate));
    }

    const [groupFilter, managementNodes] = await Promise.all([
      resolveGroupFilter(onlySector.id, requestedGroup),
      getGroupNodes(onlySector.id, true),
    ]);

    if (groupFilter.invalidSelection) {
      redirect(`${getReadyDashboardUrl(onlySector.code, calendarDate)}&groupNotice=invalid`);
    }
    if (dateNeedsCanonicalization) {
      redirect(getReadyDashboardUrl(onlySector.code, calendarDate, groupFilter.selectedNode?.id));
    }

    const { selectableGroups, scheduledWork, reminders, assigneeOptions } = await getDashboardData(
      onlySector,
      groupFilter,
      calendarDate,
    );

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
            selectableGroups={selectableGroups}
            scheduledWork={scheduledWork}
            reminders={reminders}
            assigneeOptions={assigneeOptions}
            currentUserId={context.identity.id}
            calendarDate={calendarDate}
          />
        </Container>
      </main>
    );
  }

  const activeSector = context.sectors.find((sector) => sector.code === requestedSector);

  if (sectorWasProvided && !activeSector) {
    redirect(`/dashboard?selection=invalid&date=${calendarDate}`);
  }

  if (activeSector) {
    const [groupFilter, managementNodes] = await Promise.all([
      resolveGroupFilter(activeSector.id, requestedGroup),
      getGroupNodes(activeSector.id, true),
    ]);

    if (groupFilter.invalidSelection) {
      redirect(`${getReadyDashboardUrl(activeSector.code, calendarDate)}&groupNotice=invalid`);
    }
    if (dateNeedsCanonicalization) {
      redirect(getReadyDashboardUrl(activeSector.code, calendarDate, groupFilter.selectedNode?.id));
    }

    const { selectableGroups, scheduledWork, reminders, assigneeOptions } = await getDashboardData(
      activeSector,
      groupFilter,
      calendarDate,
    );

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
            selectableGroups={selectableGroups}
            scheduledWork={scheduledWork}
            reminders={reminders}
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
      <DashboardHeader identity={context.identity} />
      <Container size="xl" py="lg">
        <SectorSelector
          sectors={context.sectors}
          selectionError={selectionError}
          prominent
          calendarDate={calendarDate}
        />
      </Container>
    </main>
  );
}
