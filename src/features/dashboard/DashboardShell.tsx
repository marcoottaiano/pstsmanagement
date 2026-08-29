"use client";

import { Box, Group, Loader, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";

import type { Sector } from "@/features/auth/auth.types";
import { DashboardCalendar } from "@/features/calendar/DashboardCalendar";
import { GroupFilterBar } from "@/features/groups/GroupFilterBar";
import type { GroupFilterContext, GroupNode } from "@/features/groups/groups.types";
import { getDescendantNodeIds, getGroupNodePath } from "@/features/groups/groups.utils";
import { ObjectiveSidebarCard } from "@/features/objectives/ObjectiveSidebarCard";
import type { Objective } from "@/features/objectives/objectives.types";
import { ReminderSidebarCard } from "@/features/reminders/ReminderSidebarCard";
import type { Reminder, ReminderPerson } from "@/features/reminders/reminders.types";
import type { ScheduledWorkCalendarItem } from "@/features/scheduled-work/scheduled-work.types";

import { loadDashboardDataAction } from "./dashboard.actions";
import type { DashboardData } from "./dashboard.data";

type DashboardShellProps = Readonly<{
  activeSector: Sector;
  groupFilter: GroupFilterContext;
  managementNodes: readonly GroupNode[];
  selectableGroups: readonly GroupNode[];
  scheduledWork: readonly ScheduledWorkCalendarItem[];
  reminders: readonly Reminder[];
  objectives: readonly Objective[];
  assigneeOptions: readonly ReminderPerson[];
  currentUserId: string;
  calendarDate: string;
}>;

export function DashboardShell({
  activeSector,
  groupFilter,
  managementNodes,
  selectableGroups,
  scheduledWork,
  reminders,
  objectives,
  assigneeOptions,
  currentUserId,
  calendarDate,
}: DashboardShellProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [activeCalendarDate, setActiveCalendarDate] = useState(calendarDate);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    selectableGroups,
    scheduledWork,
    reminders,
    objectives,
    assigneeOptions,
  });
  const selectedNode = selectedGroupId
    ? (groupFilter.nodes.find((node) => node.id === selectedGroupId) ?? null)
    : null;
  const scopedNodeIds = selectedNode
    ? getDescendantNodeIds(groupFilter.nodes, selectedNode.id)
    : new Set(groupFilter.nodes.map((node) => node.id));
  const scopeGroupIds = groupFilter.nodes
    .filter((node) => scopedNodeIds.has(node.id))
    .map((node) => node.id);
  const scopeGroupIdSet = new Set(scopeGroupIds);
  const activeGroupFilter: GroupFilterContext = {
    nodes: groupFilter.nodes,
    selectedNode,
    selectedPath: selectedNode ? getGroupNodePath(groupFilter.nodes, selectedNode) : [],
    scopeGroupIds,
    invalidSelection: false,
  };
  const visibleGroups = dashboardData.selectableGroups.filter((group) =>
    scopeGroupIdSet.has(group.id),
  );
  const visibleScheduledWork = dashboardData.scheduledWork.filter((work) =>
    scopeGroupIdSet.has(work.groupId),
  );
  const visibleReminders = dashboardData.reminders.filter(
    (reminder) => !reminder.groupId || scopedNodeIds.has(reminder.groupId),
  );
  const visibleObjectives = dashboardData.objectives.filter((objective) =>
    scopeGroupIdSet.has(objective.groupId),
  );
  const preferredGroupId = selectedNode?.id ?? null;

  async function loadData(calendarDateToLoad: string): Promise<boolean> {
    setIsRefreshing(true);
    try {
      const data = await loadDashboardDataAction({
        sectorId: activeSector.id,
        calendarDate: calendarDateToLoad,
      });
      setDashboardData(data);
      return true;
    } catch (error) {
      console.error("Dashboard data refresh failed.", error);
      notifications.show({
        color: "red",
        title: "Aggiornamento non riuscito",
        message: "Non è stato possibile aggiornare i dati. Riprova.",
      });
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }

  function refreshAction(): void {
    void loadData(activeCalendarDate);
  }

  async function calendarDateChangeAction(nextDate: string): Promise<void> {
    const previousDate = activeCalendarDate;
    setActiveCalendarDate(nextDate);
    if (!(await loadData(nextDate))) {
      setActiveCalendarDate(previousDate);
    }
  }

  return (
    <Box pos="relative" aria-busy={isRefreshing}>
      {isRefreshing ? (
        <div className="dashboard-refresh-overlay" role="status" aria-live="polite">
          <Paper withBorder p="md" radius="md" shadow="md">
            <Group gap="sm" wrap="nowrap">
              <Loader size="sm" />
              <Text fw={600}>Aggiornamento dati…</Text>
            </Group>
          </Paper>
        </div>
      ) : null}

      <Stack gap="lg">
        <GroupFilterBar
          sector={activeSector}
          filter={activeGroupFilter}
          managementNodes={managementNodes}
          selectionAction={setSelectedGroupId}
        />

        <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
          <DashboardCalendar
            sector={activeSector}
            calendarDate={activeCalendarDate}
            scheduledWork={visibleScheduledWork}
            reminders={visibleReminders}
            groups={visibleGroups}
            assigneeOptions={dashboardData.assigneeOptions}
            currentUserId={currentUserId}
            preferredGroupId={preferredGroupId}
            calendarDateChangeAction={calendarDateChangeAction}
            refreshAction={refreshAction}
          />

          <Box className="dashboard-sidebar">
            <ReminderSidebarCard
              sectorId={activeSector.id}
              reminders={visibleReminders}
              nodes={visibleGroups}
              assigneeOptions={dashboardData.assigneeOptions}
              currentUserId={currentUserId}
              preferredNodeId={preferredGroupId}
              refreshAction={refreshAction}
            />
            {selectedNode ? (
              <ObjectiveSidebarCard
                sectorId={activeSector.id}
                objectives={visibleObjectives}
                groups={visibleGroups}
                preferredGroupId={preferredGroupId}
                refreshAction={refreshAction}
              />
            ) : null}
          </Box>
        </SimpleGrid>
      </Stack>
    </Box>
  );
}
