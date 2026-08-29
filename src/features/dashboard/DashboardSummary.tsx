import {
  Badge,
  Group,
  Paper,
  Progress,
  RingProgress,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconBell,
  IconCalendarEvent,
  IconCircleCheck,
  IconClockExclamation,
  IconTargetArrow,
} from "@tabler/icons-react";

import type { DashboardSummaryData } from "./dashboard-summary.types";

type DashboardSummaryProps = Readonly<{
  data: DashboardSummaryData;
}>;

function getCompletionPercentage(completed: number, total: number): number {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

export function DashboardSummary({ data }: DashboardSummaryProps) {
  const completionPercentage = getCompletionPercentage(
    data.completedObjectiveCount,
    data.totalObjectiveCount,
  );
  const maximumWorkload = Math.max(
    1,
    ...data.groupWorkloads.map(
      (workload) => workload.scheduledWorkCount + workload.openReminderCount,
    ),
  );

  return (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, xs: 2, lg: 3 }} spacing="md">
        <Paper withBorder radius="md" p="md">
          <Group justify="space-between" align="flex-start">
            <div>
              <Text c="dimmed" size="sm">
                Attività imminenti
              </Text>
              <Title order={2}>{data.imminentWorkCount}</Title>
              <Text c="dimmed" size="xs">
                Nei prossimi 7 giorni
              </Text>
            </div>
            <ThemeIcon color="clubBlue" variant="light" radius="md" size="lg">
              <IconCalendarEvent size={20} aria-hidden="true" />
            </ThemeIcon>
          </Group>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Group justify="space-between" align="flex-start">
            <div>
              <Text c="dimmed" size="sm">
                Promemoria scaduti
              </Text>
              <Title order={2}>{data.overdueReminderCount}</Title>
              <Text c="dimmed" size="xs">
                Ancora da completare
              </Text>
            </div>
            <ThemeIcon color="red" variant="light" radius="md" size="lg">
              <IconAlertTriangle size={20} aria-hidden="true" />
            </ThemeIcon>
          </Group>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Group justify="space-between" align="center">
            <div>
              <Text c="dimmed" size="sm">
                Obiettivi completati
              </Text>
              <Title order={2}>
                {data.completedObjectiveCount} / {data.totalObjectiveCount}
              </Title>
              <Text c="dimmed" size="xs">
                Nel perimetro selezionato
              </Text>
            </div>
            <RingProgress
              size={58}
              thickness={7}
              roundCaps
              sections={[{ value: completionPercentage, color: "teal" }]}
              label={
                <Text ta="center" size="xs" fw={700}>
                  {completionPercentage}%
                </Text>
              }
            />
          </Group>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Group justify="space-between" align="flex-start">
            <div>
              <Text c="dimmed" size="sm">
                Obiettivi in ritardo
              </Text>
              <Title order={2}>{data.lateObjectiveCount}</Title>
              <Text c="dimmed" size="xs">
                Con periodo concluso
              </Text>
            </div>
            <ThemeIcon color="orange" variant="light" radius="md" size="lg">
              <IconClockExclamation size={20} aria-hidden="true" />
            </ThemeIcon>
          </Group>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Group justify="space-between" align="flex-start">
            <div>
              <Text c="dimmed" size="sm">
                Promemoria completati in ritardo
              </Text>
              <Title order={2}>{data.lateCompletedReminderCount}</Title>
              <Text c="dimmed" size="xs">
                Oltre la scadenza
              </Text>
            </div>
            <ThemeIcon color="orange" variant="light" radius="md" size="lg">
              <IconBell size={20} aria-hidden="true" />
            </ThemeIcon>
          </Group>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Group justify="space-between" align="flex-start">
            <div>
              <Text c="dimmed" size="sm">
                Obiettivi completati in ritardo
              </Text>
              <Title order={2}>{data.lateCompletedObjectiveCount}</Title>
              <Text c="dimmed" size="xs">
                Oltre la data di fine
              </Text>
            </div>
            <ThemeIcon color="orange" variant="light" radius="md" size="lg">
              <IconCircleCheck size={20} aria-hidden="true" />
            </ThemeIcon>
          </Group>
        </Paper>
      </SimpleGrid>

      <Paper withBorder radius="md" p="lg">
        <Group justify="space-between" mb="md">
          <div>
            <Title order={3} size="h4">
              Carico di lavoro per gruppo
            </Title>
            <Text c="dimmed" size="sm">
              Attività nel calendario e promemoria aperti
            </Text>
          </div>
          <ThemeIcon color="violet" variant="light" radius="md" size="lg">
            <IconTargetArrow size={20} aria-hidden="true" />
          </ThemeIcon>
        </Group>
        {data.groupWorkloads.length === 0 ? (
          <Text c="dimmed" size="sm">
            Nessuna attività o promemoria da riepilogare.
          </Text>
        ) : (
          <Stack gap="sm">
            {data.groupWorkloads.map((workload) => {
              const total = workload.scheduledWorkCount + workload.openReminderCount;
              return (
                <div key={workload.groupId}>
                  <Group justify="space-between" mb={5} wrap="nowrap">
                    <Text fw={600} size="sm" truncate="end">
                      {workload.groupName}
                    </Text>
                    <Badge variant="light" color="clubBlue">
                      {total}
                    </Badge>
                  </Group>
                  <Progress value={(total / maximumWorkload) * 100} color="clubBlue" radius="sm" />
                </div>
              );
            })}
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}
