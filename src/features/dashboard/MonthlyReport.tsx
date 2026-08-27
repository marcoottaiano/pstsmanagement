"use client";

import { Button, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconFileDescription, IconPrinter } from "@tabler/icons-react";

import type { Objective } from "@/features/objectives/objectives.types";
import type { Reminder } from "@/features/reminders/reminders.types";
import type { ScheduledWorkCalendarItem } from "@/features/scheduled-work/scheduled-work.types";

type MonthlyReportProps = Readonly<{
  sectorName: string;
  groupName: string | null;
  monthLabel: string;
  scheduledWork: readonly ScheduledWorkCalendarItem[];
  reminders: readonly Reminder[];
  objectives: readonly Objective[];
}>;

function getObjectiveStatus(status: Objective["status"]): string {
  switch (status) {
    case "NOT_STARTED":
      return "Non iniziato";
    case "IN_PROGRESS":
      return "In corso";
    case "COMPLETED":
      return "Completato";
    case "POSTPONED":
      return "Rimandato";
  }
}

function ReportList({
  title,
  items,
}: Readonly<{
  title: string;
  items: readonly Readonly<{ id: string; title: string; detail: string }>[];
}>) {
  return (
    <Paper withBorder p="lg">
      <Title order={2} size="h4" mb="sm">
        {title}
      </Title>
      {items.length === 0 ? (
        <Text c="dimmed" size="sm">
          Nessun elemento nel periodo selezionato.
        </Text>
      ) : (
        <Stack gap="xs">
          {items.map((item) => (
            <div key={item.id} className="monthly-report-item">
              <Text fw={650}>{item.title}</Text>
              <Text c="dimmed" size="sm">
                {item.detail}
              </Text>
            </div>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

export function MonthlyReport({
  sectorName,
  groupName,
  monthLabel,
  scheduledWork,
  reminders,
  objectives,
}: MonthlyReportProps) {
  return (
    <Stack gap="lg" className="monthly-report-document">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Group align="center" wrap="nowrap">
          <ThemeIcon color="clubBlue" variant="light" radius="md" size="xl">
            <IconFileDescription size={24} aria-hidden="true" />
          </ThemeIcon>
          <div>
            <Title order={1}>Report mensile</Title>
            <Text c="dimmed" mt={4}>
              {sectorName} | {groupName ?? "Tutti i gruppi"} | {monthLabel}
            </Text>
          </div>
        </Group>
        <Button
          className="monthly-report-actions"
          variant="default"
          leftSection={<IconPrinter size={18} aria-hidden="true" />}
          onClick={() => window.print()}
        >
          Stampa
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="md">
        <Paper withBorder p="md">
          <Text c="dimmed" size="sm">
            Attivita programmate
          </Text>
          <Title order={2}>{scheduledWork.length}</Title>
        </Paper>
        <Paper withBorder p="md">
          <Text c="dimmed" size="sm">
            Promemoria aperti
          </Text>
          <Title order={2}>{reminders.filter((item) => item.status === "OPEN").length}</Title>
        </Paper>
        <Paper withBorder p="md">
          <Text c="dimmed" size="sm">
            Obiettivi completati
          </Text>
          <Title order={2}>
            {objectives.filter((item) => item.status === "COMPLETED").length} / {objectives.length}
          </Title>
        </Paper>
      </SimpleGrid>

      <ReportList
        title="Attivita"
        items={scheduledWork.map((item) => ({
          id: item.id,
          title: item.title,
          detail: `${item.groupName} | ${new Intl.DateTimeFormat("it-IT", { dateStyle: "medium", timeZone: "Europe/Rome" }).format(new Date(item.startAt))}`,
        }))}
      />
      <ReportList
        title="Promemoria"
        items={reminders.map((item) => ({
          id: item.id,
          title: item.title,
          detail: `${item.groupName ?? "Generale"} | ${item.status === "OPEN" ? "Aperto" : "Completato"}`,
        }))}
      />
      <ReportList
        title="Obiettivi"
        items={objectives.map((item) => ({
          id: item.id,
          title: item.title,
          detail: `${item.groupName} | ${getObjectiveStatus(item.status)}`,
        }))}
      />
    </Stack>
  );
}
