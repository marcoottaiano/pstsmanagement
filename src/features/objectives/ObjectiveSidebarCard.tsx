"use client";

import {
  ActionIcon,
  Accordion,
  Badge,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconCircleCheck,
  IconCircleDashed,
  IconClockPause,
  IconPlayerPlay,
  IconPlus,
  IconRotateClockwise,
  IconTargetArrow,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { useState } from "react";

import type { GroupNode } from "@/features/groups/groups.types";
import { celebrateFromElement } from "@/lib/celebration";

import { updateObjectiveStatus } from "./objectives.actions";
import { ObjectiveFormModal } from "./ObjectiveFormModal";
import type { Objective, ObjectiveStatus } from "./objectives.types";
import {
  formatObjectivePeriod,
  getObjectiveSections,
  OBJECTIVE_STATUS_PRESENTATION,
} from "./objectives.utils";

type ObjectiveSidebarCardProps = Readonly<{
  sectorId: string;
  objectives: readonly Objective[];
  groups: readonly GroupNode[];
  preferredGroupId: string | null;
}>;

type ModalState = Readonly<{ item: Objective | null; key: string }>;

const OBJECTIVE_STATUS_ICONS = {
  NOT_STARTED: IconCircleDashed,
  IN_PROGRESS: IconPlayerPlay,
  POSTPONED: IconClockPause,
  COMPLETED: IconCircleCheck,
} satisfies Record<ObjectiveStatus, typeof IconTargetArrow>;

export function ObjectiveSidebarCard({
  sectorId,
  objectives,
  groups,
  preferredGroupId,
}: ObjectiveSidebarCardProps) {
  const router = useRouter();
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [pendingObjectiveId, setPendingObjectiveId] = useState<string | null>(null);
  const sections = getObjectiveSections(objectives);

  async function toggleStatus(
    objective: Objective,
    event: MouseEvent<HTMLButtonElement>,
  ): Promise<void> {
    const button = event.currentTarget;
    const completing = objective.status !== "COMPLETED";
    const nextStatus = objective.status === "COMPLETED" ? "NOT_STARTED" : "COMPLETED";
    setPendingObjectiveId(objective.id);
    const result = await updateObjectiveStatus({ id: objective.id, sectorId, status: nextStatus });
    setPendingObjectiveId(null);
    if (result.error) {
      notifications.show({ color: "red", title: "Modifica non salvata", message: result.error });
      return;
    }
    if (completing) {
      celebrateFromElement(button);
    }
    notifications.show({ color: "green", message: result.success });
    router.refresh();
  }

  return (
    <Paper withBorder p="lg" mt="lg">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs" wrap="nowrap">
            <IconTargetArrow size={24} color="var(--mantine-color-violet-6)" aria-hidden="true" />
            <Title order={2} size="h3">
              Obiettivi
            </Title>
          </Group>
          <Button
            size="xs"
            leftSection={<IconPlus size={15} aria-hidden="true" />}
            onClick={() => setModalState({ item: null, key: `create-${Date.now()}` })}
          >
            Nuovo
          </Button>
        </Group>
        <Text c="dimmed" size="xs">
          Clicca su un obiettivo per modificarlo.
        </Text>
        {sections.length === 0 ? (
          <Paper withBorder p="md" className="dashboard-empty-state">
            <Stack gap="xs" align="center">
              <IconTargetArrow size={26} aria-hidden="true" />
              <Text fw={650} size="sm">
                Nessun obiettivo in questa vista
              </Text>
              <Text c="dimmed" size="xs" ta="center">
                Definisci il primo obiettivo per il gruppo selezionato.
              </Text>
              <Button
                size="xs"
                variant="light"
                leftSection={<IconPlus size={14} aria-hidden="true" />}
                onClick={() => setModalState({ item: null, key: `create-${Date.now()}` })}
              >
                Crea obiettivo
              </Button>
            </Stack>
          </Paper>
        ) : (
          <Accordion
            multiple
            defaultValue={sections
              .filter((section) => section.status !== "COMPLETED")
              .map((section) => section.status)}
            variant="default"
            radius="sm"
          >
            {sections.map((section) => {
              const presentation = OBJECTIVE_STATUS_PRESENTATION[section.status];
              const StatusIcon = OBJECTIVE_STATUS_ICONS[section.status];

              return (
                <Accordion.Item key={section.status} value={section.status}>
                  <Accordion.Control>
                    <Group justify="space-between" pr="sm">
                      <Group gap="xs" wrap="nowrap">
                        <ThemeIcon variant="light" color={presentation.color} size="sm" radius="xl">
                          <StatusIcon size={14} aria-hidden="true" />
                        </ThemeIcon>
                        <Text fw={650} size="sm">
                          {section.label}
                        </Text>
                      </Group>
                      <Badge variant="light" color={presentation.color} size="sm">
                        {section.objectives.length}
                      </Badge>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="xs">
                      {section.objectives.map((objective) => {
                        const completed = objective.status === "COMPLETED";
                        return (
                          <Paper
                            key={objective.id}
                            withBorder
                            p="sm"
                            className="objective-list-item"
                          >
                            <Group align="flex-start" wrap="nowrap" gap="xs">
                              <UnstyledButton
                                className="objective-list-item-main"
                                onClick={() =>
                                  setModalState({ item: objective, key: `edit-${objective.id}` })
                                }
                                aria-label={`Modifica obiettivo ${objective.title}`}
                              >
                                <Stack gap={3} align="flex-start">
                                  <Text fw={650} size="sm">
                                    {objective.title}
                                  </Text>
                                  <Text c="dimmed" size="xs">
                                    {objective.groupName} · {formatObjectivePeriod(objective)}
                                  </Text>
                                </Stack>
                              </UnstyledButton>
                              <Tooltip label={completed ? "Riapri" : "Completa"}>
                                <ActionIcon
                                  variant={completed ? "light" : "filled"}
                                  color={completed ? "gray" : "teal"}
                                  loading={pendingObjectiveId === objective.id}
                                  onClick={(event) => void toggleStatus(objective, event)}
                                  aria-label={
                                    completed
                                      ? `Riapri ${objective.title}`
                                      : `Completa ${objective.title}`
                                  }
                                >
                                  {completed ? (
                                    <IconRotateClockwise size={16} aria-hidden="true" />
                                  ) : (
                                    <IconCheck size={16} aria-hidden="true" />
                                  )}
                                </ActionIcon>
                              </Tooltip>
                            </Group>
                            {objective.description ? (
                              <Text size="sm" mt="xs">
                                {objective.description}
                              </Text>
                            ) : null}
                          </Paper>
                        );
                      })}
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              );
            })}
          </Accordion>
        )}
      </Stack>
      {modalState ? (
        <ObjectiveFormModal
          key={modalState.key}
          opened
          sectorId={sectorId}
          groups={groups}
          preferredGroupId={preferredGroupId}
          item={modalState.item}
          onClose={() => setModalState(null)}
        />
      ) : null}
    </Paper>
  );
}
