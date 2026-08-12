import { Badge, Box, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";

import type { Sector } from "@/features/auth/auth.types";

import { SectorSelector } from "./SectorSelector";

type DashboardShellProps = Readonly<{
  sectors: readonly Sector[];
  activeSector: Sector;
}>;

export function DashboardShell({ sectors, activeSector }: DashboardShellProps) {
  return (
    <Stack gap="lg">
      <Paper withBorder p="md">
        <SectorSelector sectors={sectors} activeSector={activeSector} />
      </Paper>

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
          <Paper withBorder p="lg">
            <Title order={2} size="h4">
              Obiettivi
            </Title>
            <Text c="dimmed" size="sm" mt="xs">
              Seleziona un gruppo nelle prossime fasi per visualizzare gli obiettivi.
            </Text>
          </Paper>
        </Box>
      </SimpleGrid>
    </Stack>
  );
}
