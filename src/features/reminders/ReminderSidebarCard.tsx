"use client";

import {
  ActionIcon,
  Accordion,
  Avatar,
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
  IconAlertTriangle,
  IconBell,
  IconCalendarOff,
  IconCalendarTime,
  IconCheck,
  IconCircleCheck,
  IconClock,
  IconPlus,
  IconRotateClockwise,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { useState } from "react";

import { getAvatarDataUri } from "@/features/avatar/avatar";
import type { GroupNode } from "@/features/groups/groups.types";
import { celebrateFromElement } from "@/lib/celebration";

import { updateReminderStatus } from "./reminders.actions";
import { formatReminderDue } from "./reminders.dates";
import type { Reminder, ReminderPerson, ReminderPriority } from "./reminders.types";
import { getReminderSections, type ReminderSection } from "./reminders.utils";
import { ReminderFormModal } from "./ReminderFormModal";

type ReminderSidebarCardProps = Readonly<{
  sectorId: string;
  reminders: readonly Reminder[];
  groups: readonly GroupNode[];
  assigneeOptions: readonly ReminderPerson[];
  currentUserId: string;
  preferredGroupId: string | null;
}>;

type ModalState = Readonly<{
  item: Reminder | null;
  key: string;
}>;

const PRIORITY_PRESENTATION: Record<
  ReminderPriority,
  Readonly<{ label: string; color: string }>
> = {
  HIGH: { label: "Alta", color: "red" },
  NORMAL: { label: "Normale", color: "orange" },
  LOW: { label: "Bassa", color: "teal" },
};

const SECTION_PRESENTATION = {
  OVERDUE: { color: "red", icon: IconAlertTriangle },
  TODAY: { color: "orange", icon: IconCalendarTime },
  UPCOMING: { color: "blue", icon: IconClock },
  NO_DUE: { color: "gray", icon: IconCalendarOff },
  COMPLETED: { color: "teal", icon: IconCircleCheck },
} satisfies Record<ReminderSection["key"], Readonly<{ color: string; icon: typeof IconBell }>>;

export function ReminderSidebarCard({
  sectorId,
  reminders,
  groups,
  assigneeOptions,
  currentUserId,
  preferredGroupId,
}: ReminderSidebarCardProps) {
  const router = useRouter();
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [pendingReminderId, setPendingReminderId] = useState<string | null>(null);
  const sections = getReminderSections(reminders, currentUserId);

  async function toggleStatus(
    reminder: Reminder,
    event: MouseEvent<HTMLButtonElement>,
  ): Promise<void> {
    const button = event.currentTarget;
    const completing = reminder.status === "OPEN";
    setPendingReminderId(reminder.id);
    const result = await updateReminderStatus({
      id: reminder.id,
      sectorId,
      status: reminder.status === "OPEN" ? "COMPLETED" : "OPEN",
    });
    setPendingReminderId(null);

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
    <Paper withBorder p="lg">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs" wrap="nowrap">
            <IconBell size={24} color="var(--mantine-color-orange-6)" aria-hidden="true" />
            <Title order={2} size="h3">
              Promemoria
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

        {sections.length === 0 ? (
          <Paper withBorder p="md" className="dashboard-empty-state">
            <Stack gap="xs" align="center">
              <IconBell size={26} aria-hidden="true" />
              <Text fw={650} size="sm">
                Nessun promemoria in questa vista
              </Text>
              <Text c="dimmed" size="xs" ta="center">
                Crea un promemoria personale oppure associalo a un gruppo.
              </Text>
              <Button
                size="xs"
                variant="light"
                leftSection={<IconPlus size={14} aria-hidden="true" />}
                onClick={() => setModalState({ item: null, key: `create-${Date.now()}` })}
              >
                Crea promemoria
              </Button>
            </Stack>
          </Paper>
        ) : (
          <Accordion
            multiple
            defaultValue={sections
              .filter((section) => section.key !== "COMPLETED")
              .map((section) => section.key)}
            variant="default"
            radius="sm"
          >
            {sections.map((section) => {
              const presentation = SECTION_PRESENTATION[section.key];
              const SectionIcon = presentation.icon;

              return (
                <Accordion.Item key={section.key} value={section.key}>
                  <Accordion.Control>
                    <Group justify="space-between" pr="sm">
                      <Group gap="xs" wrap="nowrap">
                        <ThemeIcon variant="light" color={presentation.color} size="sm" radius="xl">
                          <SectionIcon size={14} aria-hidden="true" />
                        </ThemeIcon>
                        <Text fw={650} size="sm">
                          {section.label}
                        </Text>
                      </Group>
                      <Badge variant="light" color={presentation.color} size="sm">
                        {section.reminders.length}
                      </Badge>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="xs">
                      {section.reminders.map((reminder) => {
                        const priority = PRIORITY_PRESENTATION[reminder.priority];
                        const completed = reminder.status === "COMPLETED";
                        const assignedToCurrentUser = reminder.assignees.some(
                          (assignee) => assignee.id === currentUserId,
                        );

                        return (
                          <Paper key={reminder.id} withBorder p="sm" className="reminder-list-item">
                            <Group align="flex-start" wrap="nowrap" gap="xs">
                              <UnstyledButton
                                className="reminder-list-item-main"
                                onClick={() =>
                                  setModalState({ item: reminder, key: `edit-${reminder.id}` })
                                }
                                aria-label={`Modifica promemoria ${reminder.title}`}
                              >
                                <Stack gap={5}>
                                  <Group gap={6} wrap="wrap">
                                    <Text
                                      fw={650}
                                      size="sm"
                                      td={completed ? "line-through" : undefined}
                                    >
                                      {reminder.title}
                                    </Text>
                                    <Badge color={priority.color} variant="light" size="xs">
                                      {priority.label}
                                    </Badge>
                                    {assignedToCurrentUser ? (
                                      <Badge color="blue" variant="outline" size="xs">
                                        Assegnato a te
                                      </Badge>
                                    ) : null}
                                  </Group>
                                  <Text c="dimmed" size="xs">
                                    {reminder.groupName ?? "Personale"}
                                    {reminder.dueAt
                                      ? ` · ${formatReminderDue(reminder.dueAt, reminder.dueAllDay)}`
                                      : " · Nessuna scadenza"}
                                  </Text>
                                  {reminder.assignees.length > 0 ? (
                                    <Avatar.Group>
                                      {reminder.assignees.slice(0, 4).map((assignee) => (
                                        <Tooltip key={assignee.id} label={assignee.displayName}>
                                          <Avatar
                                            size="xs"
                                            src={getAvatarDataUri(assignee.avatar)}
                                            color="clubBlue"
                                            aria-label={assignee.displayName}
                                          >
                                            {assignee.initials}
                                          </Avatar>
                                        </Tooltip>
                                      ))}
                                      {reminder.assignees.length > 4 ? (
                                        <Avatar size="xs">+{reminder.assignees.length - 4}</Avatar>
                                      ) : null}
                                    </Avatar.Group>
                                  ) : (
                                    <Text c="dimmed" size="xs">
                                      Nessun assegnatario
                                    </Text>
                                  )}
                                </Stack>
                              </UnstyledButton>
                              <Tooltip label={completed ? "Riapri" : "Completa"}>
                                <ActionIcon
                                  variant={completed ? "light" : "filled"}
                                  color={completed ? "gray" : "teal"}
                                  loading={pendingReminderId === reminder.id}
                                  onClick={(event) => void toggleStatus(reminder, event)}
                                  aria-label={
                                    completed
                                      ? `Riapri ${reminder.title}`
                                      : `Completa ${reminder.title}`
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
        <ReminderFormModal
          key={modalState.key}
          opened
          sectorId={sectorId}
          groups={groups}
          assigneeOptions={assigneeOptions}
          currentUserId={currentUserId}
          preferredGroupId={preferredGroupId}
          item={modalState.item}
          onClose={() => setModalState(null)}
        />
      ) : null}
    </Paper>
  );
}
