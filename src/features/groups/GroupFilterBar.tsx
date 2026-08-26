"use client";

import { Button, Group, Paper, Select, Stack, Text, Title } from "@mantine/core";
import { IconFilterOff } from "@tabler/icons-react";
import { useRouter, useSearchParams } from "next/navigation";

import type { Sector } from "@/features/auth/auth.types";

import type { GroupFilterContext, GroupNode } from "./groups.types";
import { getChildNodes } from "./groups.utils";
import { GroupManagementModal } from "./GroupManagementModal";

type GroupFilterBarProps = Readonly<{
  sector: Sector;
  filter: GroupFilterContext;
  managementNodes: readonly GroupNode[];
}>;

function toSelectData(nodes: readonly GroupNode[]) {
  return nodes.map((node) => ({
    value: node.id,
    label: node.name,
  }));
}

export function GroupFilterBar({ sector, filter, managementNodes }: GroupFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("sector", sector.code);
    nextParams.delete("groupNotice");

    if (groupId) {
      nextParams.set("group", groupId);
    } else {
      nextParams.delete("group");
    }

    router.push(`/dashboard?${nextParams.toString()}`);
  }

  return (
    <Paper withBorder p="md">
      <Group justify="space-between" align="end" gap="md" wrap="wrap">
        <Stack gap="xs" className="group-filter-controls">
          <Title order={2} size="h3">
            Filtra per gruppo
          </Title>
          <Group gap="sm" align="end" wrap="wrap">
            {levels.map((nodes, index) => {
              const selectedAtLevel = filter.selectedPath[index];
              const parentAtPreviousLevel = filter.selectedPath[index - 1];

              return (
                <Select
                  key={parentAtPreviousLevel?.id ?? "root"}
                  label={index === 0 ? "Categoria o gruppo" : `Livello ${index + 1}`}
                  placeholder="Tutti i gruppi"
                  data={toSelectData(nodes)}
                  value={selectedAtLevel?.id ?? null}
                  onChange={(value) =>
                    setGroupSelection(value ?? parentAtPreviousLevel?.id ?? null)
                  }
                  clearable
                  searchable
                  w={{ base: "100%", xs: 220 }}
                />
              );
            })}
            {filter.nodes.length === 0 ? (
              <Text c="dimmed" size="sm">
                Non ci sono ancora gruppi in questo settore.
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
