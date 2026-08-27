import {
  Button,
  Container,
  Group,
  NativeSelect,
  Paper,
  SimpleGrid,
  Stack,
  TextInput,
} from "@mantine/core";
import { IconArrowLeft, IconFileDescription } from "@tabler/icons-react";
import dayjs from "dayjs";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { APP_CONFIG } from "@/config/app.config";
import { getAuthenticatedContext } from "@/features/auth/auth.data";
import { DashboardHeader } from "@/features/dashboard/DashboardHeader";
import { MonthlyReport } from "@/features/dashboard/MonthlyReport";
import { getGroupNodes } from "@/features/groups/groups.data";
import { getObjectivesForScope } from "@/features/objectives/objectives.data";
import { getVisibleReminders } from "@/features/reminders/reminders.data";
import { getScheduledWorkForVisibleRange } from "@/features/scheduled-work/scheduled-work.data";
import {
  getTodayInRome,
  getVisibleMonthRange,
  isValidCalendarDate,
} from "@/features/scheduled-work/scheduled-work.dates";

export const metadata: Metadata = {
  title: `Report mensili | ${APP_CONFIG.name}`,
};

type ReportsPageProps = Readonly<{
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>;

function getSearchValue(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function isValidMonth(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}$/.test(value) && isValidCalendarDate(`${value}-01`));
}

function isWithinMonth(value: string | null, rangeStartAt: string, rangeEndAt: string): boolean {
  return value !== null && value >= rangeStartAt && value < rangeEndAt;
}

export default async function AdminReportsPage({ searchParams }: ReportsPageProps) {
  const [context, query] = await Promise.all([getAuthenticatedContext(), searchParams]);
  if (!context) {
    redirect("/login");
  }
  if (!context.isAdmin) {
    redirect("/dashboard");
  }

  const requestedSectorId = getSearchValue(query.sector);
  const sector =
    context.sectors.find((item) => item.id === requestedSectorId) ?? context.sectors[0];
  if (!sector) {
    redirect("/dashboard");
  }

  const month = isValidMonth(getSearchValue(query.month))
    ? getSearchValue(query.month)
    : getTodayInRome().slice(0, 7);
  const nodes = await getGroupNodes(sector.id);
  const groups = nodes.filter((node) => node.nodeType === "GROUP");
  const requestedGroupId = getSearchValue(query.group);
  const selectedGroup = groups.find((group) => group.id === requestedGroupId);
  const groupIds = selectedGroup ? [selectedGroup.id] : groups.map((group) => group.id);
  const groupNames = new Map(groups.map((group) => [group.id, group.name]));
  const range = getVisibleMonthRange(`${month}-01`);
  const [scheduledWork, allReminders, allObjectives] = await Promise.all([
    getScheduledWorkForVisibleRange(sector.id, groupIds, range.startAt, range.endAt, groupNames),
    getVisibleReminders(sector.id, selectedGroup ? groupIds : null, groupNames),
    getObjectivesForScope(sector.id, groupIds, groupNames),
  ]);
  const reminders = allReminders.filter((item) =>
    isWithinMonth(item.dueAt, range.startAt, range.endAt),
  );
  const monthStart = `${month}-01`;
  const monthEnd = dayjs(monthStart).endOf("month").format("YYYY-MM-DD");
  const objectives = allObjectives.filter(
    (item) =>
      (item.periodStart === null || item.periodStart <= monthEnd) &&
      (item.periodEnd === null || item.periodEnd >= monthStart),
  );
  const monthLabel = new Intl.DateTimeFormat("it-IT", {
    month: "long",
    year: "numeric",
    timeZone: "Europe/Rome",
  }).format(new Date(`${month}-01T12:00:00`));

  return (
    <main className="dashboard-page">
      <DashboardHeader identity={context.identity} isAdmin />
      <Container className="dashboard-content" py="xl">
        <Stack gap="xl">
          <div className="monthly-report-actions">
            <Link href="/dashboard">
              <Button
                component="span"
                variant="subtle"
                color="gray"
                px={0}
                leftSection={<IconArrowLeft size={17} aria-hidden="true" />}
              >
                Torna alla dashboard
              </Button>
            </Link>
          </div>
          <Paper withBorder p="lg" className="monthly-report-actions">
            <form action="/dashboard/admin/reports" method="get">
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                <NativeSelect
                  name="sector"
                  label="Settore"
                  data={context.sectors.map((item) => ({ value: item.id, label: item.name }))}
                  defaultValue={sector.id}
                />
                <NativeSelect
                  name="group"
                  label="Gruppo"
                  data={[
                    { value: "", label: "Tutti i gruppi" },
                    ...groups.map((item) => ({ value: item.id, label: item.name })),
                  ]}
                  defaultValue={selectedGroup?.id ?? ""}
                />
                <TextInput name="month" type="month" label="Mese" defaultValue={month} />
              </SimpleGrid>
              <Group justify="flex-end" mt="md">
                <Button
                  type="submit"
                  leftSection={<IconFileDescription size={17} aria-hidden="true" />}
                >
                  Aggiorna report
                </Button>
              </Group>
            </form>
          </Paper>
          <MonthlyReport
            sectorName={sector.name}
            groupName={selectedGroup?.name ?? null}
            monthLabel={monthLabel}
            scheduledWork={scheduledWork}
            reminders={reminders}
            objectives={objectives}
          />
        </Stack>
      </Container>
    </main>
  );
}
