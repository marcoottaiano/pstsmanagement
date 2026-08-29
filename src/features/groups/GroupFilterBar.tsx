"use client";

import { Button, Group, Paper, Select, Stack, Text, Title } from "@mantine/core";
import { IconFilter, IconFilterOff } from "@tabler/icons-react";

import type { Sector } from "@/features/auth/auth.types";

import type { GroupFilterContext, GroupNode } from "./groups.types";
import { getChildNodes } from "./groups.utils";
import { GroupManagementModal } from "./GroupManagementModal";

type GroupFilterBarProps = Readonly<{
  sector: Sector;
  filter: GroupFilterContext;
  managementNodes: readonly GroupNode[];
  selectionAction: (groupId: string | null) => void;
}>;

function toSelectData(nodes: readonly GroupNode[]) {
  return nodes.map((node) => ({
    value: node.id,
    label: node.name,
  }));
}

export function GroupFilterBar({
  sector,
  filter,
  managementNodes,
  selectionAction,
}: GroupFilterBarProps) {
  const levels: (readonly GroupNode[])[] = [];
  let parentId: string | null = null;

  do {
    const children = getChildNodes(filter.nodes, parentId);
    if (children.length === 0) {
      break;
    }

    levels.push(children);
    const selectedAtLevel = filter.selectedPath[levels.length - 1];
    if (!selectedAtLevel) {
      break;
    }

    parentId = selectedAtLevel.id;
  } while (true);

  function setGroupSelection(groupId: string | null): void {
    selectionAction(groupId);
  }

  return (
    <Paper withBorder p="md">
      <Group justify="space-between" align="end" gap="md" wrap="wrap">
        <Stack gap="xs" className="group-filter-controls">
          <Group gap="xs" wrap="nowrap">
            <IconFilter size={24} color="var(--mantine-color-blue-6)" aria-hidden="true" />
            <Title order={2} size="h3">
              Filtra per gruppo
            </Title>
          </Group>
          <Group gap="sm" align="end" wrap="wrap" style={{ width: "100%" }}>
            {levels.map((nodes, index) => {
              const selectedAtLevel = filter.selectedPath[index];
              const parentAtPreviousLevel = filter.selectedPath[index - 1];

              return (
                <Select
                  key={parentAtPreviousLevel?.id ?? "root"}
                  label={index === 0 ? "Gruppo" : `Sottogruppo · livello ${index + 1}`}
                  placeholder="Tutti i gruppi"
                  data={toSelectData(nodes)}
                  value={selectedAtLevel?.id ?? null}
                  onChange={(value) =>
                    setGroupSelection(value ?? parentAtPreviousLevel?.id ?? null)
                  }
                  searchable
                  clearable
                  w={{ base: "100%", sm: 240 }}
                  maxDropdownHeight={300}
                />
              );
            })}
            {filter.nodes.length === 0 ? (
              <Text c="dimmed" size="sm">
                Non ci sono ancora gruppi. Usa “Gestisci gruppi” per creare il primo.
              </Text>
            ) : null}
            {filter.selectedNode ? (
              <Button
                variant="subtle"
                color="gray"
                leftSection={<IconFilterOff size={16} />}
                onClick={() => setGroupSelection(null)}
              >
                Azzera filtro
              </Button>
            ) : null}
          </Group>
        </Stack>

        <GroupManagementModal sector={sector} nodes={managementNodes} />
      </Group>
    </Paper>
  );
}
