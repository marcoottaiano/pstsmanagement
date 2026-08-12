import { Badge, Box, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";

import type { Sector } from "@/features/auth/auth.types";
import { GroupFilterBar } from "@/features/groups/GroupFilterBar";
import type { GroupFilterContext, GroupNode } from "@/features/groups/groups.types";

import { SectorSelector } from "./SectorSelector";

type DashboardShellProps = Readonly<{
  sectors: readonly Sector[];
  activeSector: Sector;
  groupFilter: GroupFilterContext;
  managementNodes: readonly GroupNode[];
}>;

export function DashboardShell({
  sectors,
  activeSector,
  groupFilter,
  managementNodes,
}: DashboardShellProps) {
  return (
    <Stack gap="lg">
      <Paper withBorder p="md">
        <SectorSelector sectors={sectors} activeSector={activeSector} />
      </Paper>

      <GroupFilterBar
        sector={activeSector}
        filter={groupFilter}
        managementNodes={managementNodes}
      />

      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
        <Paper withBorder p={{ base: "lg", sm: "xl" }} className="dashboard-calendar-placeholder">
          <Stack gap="sm">
            <Badge variant="light" w="fit-content">
              Prossima fase
            </Badge>
            <Title order={2} size="h3">
              Calendario
            </Title>
            <Text c="dimmed">
              La pianificazione mensile di {activeSector.name} sarà disponibile nelle prossime fasi.
            </Text>
          </Stack>
        </Paper>

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
