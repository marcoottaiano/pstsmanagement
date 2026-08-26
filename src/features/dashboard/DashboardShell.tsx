import { Box, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";

import type { Sector } from "@/features/auth/auth.types";
import { DashboardCalendar } from "@/features/calendar/DashboardCalendar";
import { GroupFilterBar } from "@/features/groups/GroupFilterBar";
import type { GroupFilterContext, GroupNode } from "@/features/groups/groups.types";
import { ReminderSidebarCard } from "@/features/reminders/ReminderSidebarCard";
import type { Reminder, ReminderPerson } from "@/features/reminders/reminders.types";
import type { ScheduledWorkCalendarItem } from "@/features/scheduled-work/scheduled-work.types";

type DashboardShellProps = Readonly<{
  activeSector: Sector;
  groupFilter: GroupFilterContext;
  managementNodes: readonly GroupNode[];
  selectableGroups: readonly GroupNode[];
  scheduledWork: readonly ScheduledWorkCalendarItem[];
  reminders: readonly Reminder[];
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
  assigneeOptions,
  currentUserId,
  calendarDate,
}: DashboardShellProps) {
  const preferredGroupId =
    groupFilter.selectedNode?.nodeType === "GROUP" ? groupFilter.selectedNode.id : null;

  return (
    <Stack gap="lg">
      <GroupFilterBar
        sector={activeSector}
        filter={groupFilter}
        managementNodes={managementNodes}
      />

      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
        <DashboardCalendar
          sector={activeSector}
          calendarDate={calendarDate}
          scheduledWork={scheduledWork}
          reminders={reminders}
          groups={selectableGroups}
          assigneeOptions={assigneeOptions}
          currentUserId={currentUserId}
          preferredGroupId={preferredGroupId}
        />

        <Box className="dashboard-sidebar">
          <ReminderSidebarCard
            sectorId={activeSector.id}
            reminders={reminders}
            groups={selectableGroups}
            assigneeOptions={assigneeOptions}
            currentUserId={currentUserId}
            preferredGroupId={preferredGroupId}
          />
          {groupFilter.selectedNode ? (
            <Paper withBorder p="lg">
              <Title order={2} size="h3">
                Obiettivi
              </Title>
              <Text c="dimmed" size="sm" mt="xs">
                Gli obiettivi di {groupFilter.selectedNode.name} saranno disponibili nelle prossime
                fasi.
              </Text>
            </Paper>
          ) : null}
        </Box>
      </SimpleGrid>
    </Stack>
  );
}
