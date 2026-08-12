import { Box, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";

import type { Sector } from "@/features/auth/auth.types";
import { GroupFilterBar } from "@/features/groups/GroupFilterBar";
import type { GroupFilterContext, GroupNode } from "@/features/groups/groups.types";
import { ScheduledWorkCalendar } from "@/features/scheduled-work/ScheduledWorkCalendar";
import type { CalendarItem } from "@/features/scheduled-work/scheduled-work.types";

import { SectorSelector } from "./SectorSelector";

type DashboardShellProps = Readonly<{
  sectors: readonly Sector[];
  activeSector: Sector;
  groupFilter: GroupFilterContext;
  managementNodes: readonly GroupNode[];
  selectableGroups: readonly GroupNode[];
  scheduledWork: readonly CalendarItem[];
  calendarDate: string;
}>;

export function DashboardShell({
  sectors,
  activeSector,
  groupFilter,
  managementNodes,
  selectableGroups,
  scheduledWork,
  calendarDate,
}: DashboardShellProps) {
  return (
    <Stack gap="lg">
      <Paper withBorder p="md">
        <SectorSelector sectors={sectors} activeSector={activeSector} calendarDate={calendarDate} />
      </Paper>

      <GroupFilterBar
        sector={activeSector}
        filter={groupFilter}
        managementNodes={managementNodes}
      />

      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
        <ScheduledWorkCalendar
          sector={activeSector}
          calendarDate={calendarDate}
          items={scheduledWork}
          groups={selectableGroups}
          preferredGroupId={
            groupFilter.selectedNode?.nodeType === "GROUP" ? groupFilter.selectedNode.id : null
          }
        />

        <Box className="dashboard-sidebar">
          <Paper withBorder p="lg">
            <Title order={2} size="h4">
              Promemoria
            </Title>
            <Text c="dimmed" size="sm" mt="xs">
              Nessuna funzionalità ancora disponibile.
            </Text>
          </Paper>
          {groupFilter.selectedNode ? (
            <Paper withBorder p="lg">
              <Title order={2} size="h4">
                Obiettivi
              </Title>
              <Text c="dimmed" size="sm" mt="xs">
                Gli obiettivi di {groupFilter.selectedNode.name} saranno disponibili nelle prossime
                fasi.
              </Text>
            </Paper>
          ) : null}
        </Box>
      </SimpleGrid>
    </Stack>
  );
}
