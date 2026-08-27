"use client";

import { Button, Group, Paper, Select, SimpleGrid, Stack, Text } from "@mantine/core";
import { IconFilter, IconRefresh } from "@tabler/icons-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { ActivityFilterOption, ActivityLogFilters } from "./activity.types";

type ActivityFiltersProps = Readonly<{
  filters: ActivityLogFilters;
  actors: readonly ActivityFilterOption[];
  sectors: readonly ActivityFilterOption[];
}>;

const entityOptions: readonly ActivityFilterOption[] = [
  { value: "SCHEDULED_WORK", label: "Lavori" },
  { value: "REMINDER", label: "Promemoria" },
  { value: "OBJECTIVE", label: "Obiettivi" },
  { value: "GROUP", label: "Gruppi" },
  { value: "USER", label: "Utenti" },
];

const periodOptions: readonly ActivityFilterOption[] = [
  { value: "TODAY", label: "Oggi" },
  { value: "7_DAYS", label: "Ultimi 7 giorni" },
  { value: "30_DAYS", label: "Ultimi 30 giorni" },
  { value: "ALL", label: "Tutto il periodo" },
];

export function ActivityFilters({ filters, actors, sectors }: ActivityFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(name: string, value: string | null): void {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (value) {
      nextParams.set(name, value);
    } else {
      nextParams.delete(name);
    }
    nextParams.delete("page");
    const query = nextParams.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <Paper withBorder radius="lg" p="lg">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <IconFilter size={19} color="var(--mantine-color-clubBlue-6)" aria-hidden="true" />
            <Text fw={700}>Filtri</Text>
          </Group>
          <Button
            variant="subtle"
            color="gray"
            size="compact-sm"
            leftSection={<IconRefresh size={15} aria-hidden="true" />}
            onClick={() => router.push(pathname)}
          >
            Azzera
          </Button>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          <Select
            label="Autore"
            placeholder="Tutti gli utenti"
            data={[...actors]}
            value={filters.actorId ?? null}
            onChange={(value) => updateFilter("actor", value)}
            clearable
            searchable
            nothingFoundMessage="Nessun utente trovato"
          />
          <Select
            label="Tipo di contenuto"
            placeholder="Tutte le attività"
            data={[...entityOptions]}
            value={filters.entityType ?? null}
            onChange={(value) => updateFilter("entity", value)}
            clearable
          />
          <Select
            label="Settore"
            placeholder="Tutti i settori"
            data={[...sectors]}
            value={filters.sectorId ?? null}
            onChange={(value) => updateFilter("sector", value)}
            clearable
          />
          <Select
            label="Periodo"
            data={[...periodOptions]}
            value={filters.period}
            allowDeselect={false}
            onChange={(value) => updateFilter("period", value)}
          />
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}
