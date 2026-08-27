import { Button, Container, Group, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconArrowLeft, IconChartBar } from "@tabler/icons-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { APP_CONFIG } from "@/config/app.config";
import { getAuthenticatedContext } from "@/features/auth/auth.data";
import { DashboardHeader } from "@/features/dashboard/DashboardHeader";
import { DashboardSummary } from "@/features/dashboard/DashboardSummary";
import { getDashboardSummary } from "@/features/dashboard/dashboard-summary.data";
import type { DashboardSummaryData } from "@/features/dashboard/dashboard-summary.types";
import { getGroupNodes } from "@/features/groups/groups.data";
import { getObjectivesForScope } from "@/features/objectives/objectives.data";
import { getVisibleReminders } from "@/features/reminders/reminders.data";
import { getScheduledWorkForVisibleRange } from "@/features/scheduled-work/scheduled-work.data";
import {
  getUpcomingWeekRange,
  getTodayInRome,
  getVisibleMonthRange,
} from "@/features/scheduled-work/scheduled-work.dates";

export const metadata: Metadata = {
  title: `Statistiche | ${APP_CONFIG.name}`,
};

type SectorStatistics = Readonly<{
  sectorName: string;
  summary: DashboardSummaryData;
}>;

async function getSectorStatistics(
  sectorId: string,
  sectorName: string,
): Promise<SectorStatistics> {
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
    sectorName,
    summary: getDashboardSummary(upcomingWork, scheduledWork, reminders, objectives),
  };
}

export default async function AdminStatisticsPage() {
  const context = await getAuthenticatedContext();
  if (!context) {
    redirect("/login");
  }
  if (!context.isAdmin) {
    redirect("/dashboard");
  }

  const statistics = await Promise.all(
    context.sectors.map((sector) => getSectorStatistics(sector.id, sector.name)),
  );

  return (
    <main className="dashboard-page">
      <DashboardHeader identity={context.identity} isAdmin />
      <Container className="dashboard-content" py="xl">
        <Stack gap="xl">
          <div>
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
            <Group align="center" wrap="nowrap" mt="sm">
              <ThemeIcon color="clubBlue" variant="light" radius="md" size="xl">
                <IconChartBar size={24} aria-hidden="true" />
              </ThemeIcon>
              <div>
                <Title order={1}>Statistiche</Title>
                <Text c="dimmed" mt={4}>
                  Panoramica operativa dei settori a cui hai accesso.
                </Text>
              </div>
            </Group>
          </div>

          {statistics.map((item) => (
            <Stack key={item.sectorName} gap="md">
              <Title order={2} size="h3">
                {item.sectorName}
              </Title>
              <DashboardSummary data={item.summary} />
            </Stack>
          ))}
        </Stack>
      </Container>
    </main>
  );
}
