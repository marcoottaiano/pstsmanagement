import {
  Button,
  Container,
  Group,
  NativeSelect,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconArrowLeft, IconChartBar, IconFileDescription } from "@tabler/icons-react";
import dayjs from "dayjs";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { APP_CONFIG } from "@/config/app.config";
import { getAuthenticatedContext } from "@/features/auth/auth.data";
import { DashboardHeader } from "@/features/dashboard/DashboardHeader";
import { DashboardSummary } from "@/features/dashboard/DashboardSummary";
import { getDashboardSummary } from "@/features/dashboard/dashboard-summary.data";
import type { DashboardSummaryData } from "@/features/dashboard/dashboard-summary.types";
import { MonthlyReport } from "@/features/dashboard/MonthlyReport";
import { getGroupNodes } from "@/features/groups/groups.data";
import { getObjectivesForScope } from "@/features/objectives/objectives.data";
import { getVisibleReminders } from "@/features/reminders/reminders.data";
import { getScheduledWorkForVisibleRange } from "@/features/scheduled-work/scheduled-work.data";
import {
  getUpcomingWeekRange,
  getTodayInRome,
  getVisibleMonthRange,
  isValidCalendarDate,
} from "@/features/scheduled-work/scheduled-work.dates";

export const metadata: Metadata = {
  title: `Statistiche | ${APP_CONFIG.name}`,
};

type SectorStatistics = Readonly<{
  summary: DashboardSummaryData;
}>;

type AdminStatisticsPageProps = Readonly<{
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

async function getSectorStatistics(sectorId: string): Promise<SectorStatistics> {
  const groups = await getGroupNodes(sectorId);
  const groupIds = groups.filter((group) => group.nodeType === "GROUP").map((group) => group.id);
  const groupNames = new Map(
    groups.filter((group) => group.nodeType === "GROUP").map((group) => [group.id, group.name]),
  );
  const monthRange = getVisibleMonthRange(getTodayInRome());
  const upcomingRange = getUpcomingWeekRange();
  const [scheduledWork, upcomingWork, reminders, objectives] = await Promise.all([
    getScheduledWorkForVisibleRange(
      sectorId,
      groupIds,
      monthRange.startAt,
      monthRange.endAt,
      groupNames,
    ),
    getScheduledWorkForVisibleRange(
      sectorId,
      groupIds,
      upcomingRange.startAt,
      upcomingRange.endAt,
      groupNames,
    ),
    getVisibleReminders(sectorId, null, groupNames),
    getObjectivesForScope(sectorId, groupIds, groupNames),
  ]);

  return {
    summary: getDashboardSummary(upcomingWork, scheduledWork, reminders, objectives),
  };
}

export default async function AdminStatisticsPage({ searchParams }: AdminStatisticsPageProps) {
  const [context, query] = await Promise.all([getAuthenticatedContext(), searchParams]);
  if (!context) {
    redirect("/login");
  }
  if (!context.isAdmin) {
    redirect("/dashboard");
  }

  const requestedSectorCode = getSearchValue(query.sector);
  const activeSector =
    context.sectors.find((sector) => sector.code === requestedSectorCode) ?? context.sectors[0];

  if (!activeSector) {
    redirect("/dashboard");
  }

  const month = isValidMonth(getSearchValue(query.month))
    ? getSearchValue(query.month)
    : getTodayInRome().slice(0, 7);
  const nodes = await getGroupNodes(activeSector.id);
  const groups = nodes.filter((node) => node.nodeType === "GROUP");
  const requestedGroupId = getSearchValue(query.group);
  const selectedGroup = groups.find((group) => group.id === requestedGroupId);
  const reportGroupIds = selectedGroup ? [selectedGroup.id] : groups.map((group) => group.id);
  const groupNames = new Map(groups.map((group) => [group.id, group.name]));
  const reportRange = getVisibleMonthRange(`${month}-01`);
  const [statistics, reportScheduledWork, reportReminders, reportObjectives] = await Promise.all([
    getSectorStatistics(activeSector.id),
    getScheduledWorkForVisibleRange(
      activeSector.id,
      reportGroupIds,
      reportRange.startAt,
      reportRange.endAt,
      groupNames,
    ),
    getVisibleReminders(activeSector.id, selectedGroup ? reportGroupIds : null, groupNames),
    getObjectivesForScope(activeSector.id, reportGroupIds, groupNames),
  ]);
  const monthlyReminders = reportReminders.filter((item) =>
    isWithinMonth(item.dueAt, reportRange.startAt, reportRange.endAt),
  );
  const monthStart = `${month}-01`;
  const monthEnd = dayjs(monthStart).endOf("month").format("YYYY-MM-DD");
  const monthlyObjectives = reportObjectives.filter(
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
      <DashboardHeader
        identity={context.identity}
        sectors={context.sectors}
        activeSector={activeSector}
        isAdmin
      />
      <Container className="dashboard-content" py="xl">
        <Stack gap="xl">
          <div>
            <Link href={`/dashboard?sector=${activeSector.code}`}>
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
            <Group align="center" wrap="nowrap" mt="sm">
              <ThemeIcon color="clubBlue" variant="light" radius="md" size="xl">
                <IconChartBar size={24} aria-hidden="true" />
              </ThemeIcon>
              <div>
                <Title order={1}>Statistiche</Title>
                <Text c="dimmed" mt={4}>
                  Panoramica operativa di {activeSector.name}.
                </Text>
              </div>
            </Group>
          </div>

          <DashboardSummary data={statistics.summary} />

          <Paper withBorder p="lg" className="monthly-report-actions">
            <form action="/dashboard/admin/statistics" method="get">
              <input type="hidden" name="sector" value={activeSector.code} />
              <Group gap="xs" mb="md">
                <ThemeIcon color="clubBlue" variant="light" radius="md" size="lg">
                  <IconFileDescription size={19} aria-hidden="true" />
                </ThemeIcon>
                <Text fw={700}>Report mensile</Text>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <NativeSelect
                  name="group"
                  label="Gruppo report"
                  data={[
                    { value: "", label: "Tutti i gruppi" },
                    ...groups.map((item) => ({ value: item.id, label: item.name })),
                  ]}
                  defaultValue={selectedGroup?.id ?? ""}
                />
                <TextInput name="month" type="month" label="Mese report" defaultValue={month} />
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
            sectorName={activeSector.name}
            groupName={selectedGroup?.name ?? null}
            monthLabel={monthLabel}
            scheduledWork={reportScheduledWork}
            reminders={monthlyReminders}
            objectives={monthlyObjectives}
          />
        </Stack>
      </Container>
    </main>
  );
}
