import { Badge, Group, Paper, Stack, Text, ThemeIcon } from "@mantine/core";
import {
  IconArchive,
  IconCheck,
  IconEdit,
  IconHistory,
  IconMailPlus,
  IconPlus,
  IconRefresh,
  IconRestore,
  IconSettings,
  IconTrash,
  IconUserX,
} from "@tabler/icons-react";
import type { ReactNode } from "react";

import { formatActivityDate } from "./activity.dates";
import type {
  ActivityAction,
  ActivityEntityType,
  ActivityFilterOption,
  ActivityLogItem,
} from "./activity.types";

type ActivityLogListProps = Readonly<{
  items: readonly ActivityLogItem[];
  sectors: readonly ActivityFilterOption[];
}>;

type ActionPresentation = Readonly<{
  color: string;
  verb: string;
  icon: ReactNode;
}>;

function getActionPresentation(action: ActivityAction): ActionPresentation {
  switch (action) {
    case "CREATED":
      return { color: "green", verb: "ha creato", icon: <IconPlus size={17} /> };
    case "UPDATED":
      return { color: "blue", verb: "ha aggiornato", icon: <IconEdit size={17} /> };
    case "DELETED":
      return { color: "red", verb: "ha eliminato", icon: <IconTrash size={17} /> };
    case "COMPLETED":
      return { color: "teal", verb: "ha completato", icon: <IconCheck size={17} /> };
    case "REOPENED":
      return { color: "yellow", verb: "ha riaperto", icon: <IconRefresh size={17} /> };
    case "ARCHIVED":
      return { color: "orange", verb: "ha archiviato", icon: <IconArchive size={17} /> };
    case "RESTORED":
      return { color: "green", verb: "ha ripristinato", icon: <IconRestore size={17} /> };
    case "INVITED":
      return { color: "violet", verb: "ha invitato", icon: <IconMailPlus size={17} /> };
    case "ACCESS_UPDATED":
      return {
        color: "blue",
        verb: "ha modificato gli accessi di",
        icon: <IconSettings size={17} />,
      };
    case "USER_DELETED":
      return { color: "red", verb: "ha eliminato", icon: <IconUserX size={17} /> };
  }
}

function getEntityLabel(entityType: ActivityEntityType): string {
  switch (entityType) {
    case "SCHEDULED_WORK":
      return "il lavoro";
    case "REMINDER":
      return "il promemoria";
    case "OBJECTIVE":
      return "l’obiettivo";
    case "GROUP":
      return "il gruppo";
    case "USER":
      return "l’utente";
  }
}

function getStatusLabel(status: unknown): string | null {
  switch (status) {
    case "OPEN":
      return "aperto";
    case "NOT_STARTED":
      return "non iniziato";
    case "IN_PROGRESS":
      return "in corso";
    case "COMPLETED":
      return "completato";
    case "POSTPONED":
      return "rimandato";
    default:
      return null;
  }
}

export function ActivityLogList({ items, sectors }: ActivityLogListProps) {
  if (items.length === 0) {
    return (
      <Paper withBorder radius="lg" p="xl" className="dashboard-empty-state">
        <Stack align="center" gap="xs" ta="center">
          <IconHistory size={34} aria-hidden="true" />
          <Text fw={700} c="dark">
            Nessuna attività trovata
          </Text>
          <Text size="sm">Prova a modificare i filtri oppure seleziona un periodo più ampio.</Text>
        </Stack>
      </Paper>
    );
  }

  const sectorNameById = new Map(sectors.map((sector) => [sector.value, sector.label]));

  return (
    <Stack gap="sm">
      {items.map((item) => {
        const presentation = getActionPresentation(item.action);
        const previousStatus = getStatusLabel(item.metadata.previous_status);
        const currentStatus = getStatusLabel(item.metadata.current_status);
        const sectorName = item.sectorId ? sectorNameById.get(item.sectorId) : undefined;

        return (
          <Paper key={item.id} withBorder radius="lg" p="md" className="activity-log-item">
            <Group align="flex-start" wrap="nowrap">
              <ThemeIcon color={presentation.color} variant="light" radius="xl" size="lg">
                {presentation.icon}
              </ThemeIcon>
              <Stack gap={5} className="activity-log-item-content">
                <Text>
                  <Text span fw={700}>
                    {item.actorName}
                  </Text>{" "}
                  {presentation.verb} {getEntityLabel(item.entityType)}{" "}
                  <Text span fw={650}>
                    “{item.entityTitle}”
                  </Text>
                </Text>
                <Group gap="xs">
                  <Text c="dimmed" size="xs">
                    {formatActivityDate(item.createdAt)}
                  </Text>
                  {sectorName ? (
                    <Badge color="grape" variant="light" size="sm">
                      {sectorName}
                    </Badge>
                  ) : null}
                </Group>
                {previousStatus && currentStatus ? (
                  <Text c="dimmed" size="xs">
                    Stato: {previousStatus} → {currentStatus}
                  </Text>
                ) : null}
              </Stack>
            </Group>
          </Paper>
        );
      })}
    </Stack>
  );
}
