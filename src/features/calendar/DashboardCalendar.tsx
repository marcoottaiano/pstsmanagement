"use client";

import type { DatesSetArg, EventClickArg, EventContentArg, EventDropArg } from "@fullcalendar/core";
import itLocale from "@fullcalendar/core/locales/it";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, {
  type DateClickArg,
  type EventResizeDoneArg,
} from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import { Button, Group, Paper, Stack, Text, Title, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCalendarMonth, IconPlus } from "@tabler/icons-react";
import { useState } from "react";

import type { Sector } from "@/features/auth/auth.types";
import type { GroupNode } from "@/features/groups/groups.types";
import { updateReminderDue } from "@/features/reminders/reminders.actions";
import { reminderDueToIso } from "@/features/reminders/reminders.dates";
import { toReminderCalendarItem, toReminderEvent } from "@/features/reminders/reminders.mapper";
import type { Reminder, ReminderPerson } from "@/features/reminders/reminders.types";
import { ReminderFormModal } from "@/features/reminders/ReminderFormModal";
import { updateScheduledWorkDates } from "@/features/scheduled-work/scheduled-work.actions";
import {
  romeDateTimeToIso,
  roundCurrentRomeTime,
} from "@/features/scheduled-work/scheduled-work.dates";
import { toScheduledWorkEvent } from "@/features/scheduled-work/scheduled-work.mapper";
import type {
  ScheduledWorkCalendarItem,
  UpdateScheduledWorkDatesInput,
} from "@/features/scheduled-work/scheduled-work.types";
import {
  ScheduledWorkFormModal,
  type ScheduledWorkPreset,
} from "@/features/scheduled-work/ScheduledWorkFormModal";

import { CalendarExportMenu } from "./CalendarExportMenu";
import type { CalendarItem } from "./calendar.types";

type DashboardCalendarProps = Readonly<{
  sector: Sector;
  calendarDate: string;
  scheduledWork: readonly ScheduledWorkCalendarItem[];
  reminders: readonly Reminder[];
  groups: readonly GroupNode[];
  workGroupOptions: readonly GroupNode[];
  assigneeOptions: readonly ReminderPerson[];
  currentUserId: string;
  preferredGroupId: string | null;
  calendarDateChangeAction: (calendarDate: string) => Promise<void>;
  refreshAction: () => void;
}>;

type ModalState =
  | Readonly<{
      type: "scheduledWork";
      item: ScheduledWorkCalendarItem | null;
      preset: ScheduledWorkPreset;
      key: string;
    }>
  | Readonly<{
      type: "reminder";
      item: Reminder;
      key: string;
    }>;

function getDefaultPreset(): ScheduledWorkPreset {
  const current = roundCurrentRomeTime();
  return { allDay: false, ...current };
}

function getDateClickPreset(date: string): ScheduledWorkPreset {
  return {
    allDay: true,
    startDate: date,
    startTime: "00:00",
    endDate: date,
    endTime: "00:00",
  };
}

function getCalendarMonthDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

function getScheduledWorkDateInput(
  event: EventDropArg["event"],
): UpdateScheduledWorkDatesInput | null {
  const startValue = event.startStr.slice(0, 16);
  const endValue = event.endStr.slice(0, 16);
  const startAt = event.allDay
    ? romeDateTimeToIso(startValue.slice(0, 10))
    : romeDateTimeToIso(startValue.slice(0, 10), startValue.slice(11, 16));
  const endAt = event.end
    ? event.allDay
      ? romeDateTimeToIso(endValue.slice(0, 10))
      : romeDateTimeToIso(endValue.slice(0, 10), endValue.slice(11, 16))
    : null;

  if (!startAt || (event.end && !endAt)) {
    return null;
  }

  return {
    id: String(event.extendedProps.itemId),
    sectorId: String(event.extendedProps.sectorId),
    startAt,
    endAt,
    allDay: event.allDay,
  };
}

function getReminderDueInput(event: EventDropArg["event"]) {
  const startValue = event.startStr.slice(0, 16);
  const dueAt = event.allDay
    ? reminderDueToIso(startValue.slice(0, 10), "")
    : reminderDueToIso(startValue.slice(0, 10), startValue.slice(11, 16));

  return dueAt
    ? {
        id: String(event.extendedProps.itemId),
        sectorId: String(event.extendedProps.sectorId),
        dueAt,
        dueAllDay: event.allDay,
      }
    : null;
}

function toFullCalendarEvent(item: CalendarItem) {
  return item.itemType === "scheduledWork" ? toScheduledWorkEvent(item) : toReminderEvent(item);
}

function EventContent({ event, timeText }: EventContentArg) {
  const reminder = event.extendedProps.itemType === "reminder";
  const kind = reminder ? "Promemoria" : "Lavoro programmato";
  const groupName = String(event.extendedProps.groupName);

  return (
    <Tooltip
      withArrow
      multiline
      openDelay={350}
      position="top"
      label={
        <Stack gap={2}>
          <Text size="xs" fw={700}>
            {event.title}
          </Text>
          <Text size="xs">{kind}</Text>
          <Text size="xs">{groupName}</Text>
          {timeText ? <Text size="xs">{timeText}</Text> : null}
        </Stack>
      }
    >
      <span className="calendar-event-content">
        <span className="calendar-event-kind">{reminder ? "Promemoria" : "Lavoro"}</span>
        {timeText ? <span className="calendar-event-time">{timeText}</span> : null}
        <span className="calendar-event-title">{event.title}</span>
        <span className="calendar-event-group">{groupName}</span>
      </span>
    </Tooltip>
  );
}

export function DashboardCalendar({
  sector,
  calendarDate,
  scheduledWork,
  reminders,
  groups,
  workGroupOptions,
  assigneeOptions,
  currentUserId,
  preferredGroupId,
  calendarDateChangeAction,
  refreshAction,
}: DashboardCalendarProps) {
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const calendarItems: CalendarItem[] = [
    ...scheduledWork,
    ...reminders.filter((reminder) => reminder.dueAt !== null).map(toReminderCalendarItem),
  ];
  const calendarScopeKey = `${calendarDate}:${groups.map((group) => group.id).join(",")}`;

  function openScheduledWorkModal(preset: ScheduledWorkPreset): void {
    setModalState({
      type: "scheduledWork",
      item: null,
      preset,
      key: `create-work-${Date.now()}`,
    });
  }

  function handleEventClick({ event }: EventClickArg): void {
    const itemId = String(event.extendedProps.itemId);
    if (event.extendedProps.itemType === "reminder") {
      const reminder = reminders.find((candidate) => candidate.id === itemId);
      if (reminder) {
        setModalState({ type: "reminder", item: reminder, key: `edit-reminder-${itemId}` });
      }
      return;
    }

    const item = scheduledWork.find((candidate) => candidate.id === itemId);
    if (item) {
      setModalState({
        type: "scheduledWork",
        item,
        preset: getDefaultPreset(),
        key: `edit-work-${itemId}`,
      });
    }
  }

  function handleDatesSet({ view }: DatesSetArg): void {
    const nextDate = getCalendarMonthDate(view.currentStart);
    if (nextDate.slice(0, 7) === calendarDate.slice(0, 7)) {
      return;
    }

    void calendarDateChangeAction(nextDate);
  }

  async function persistDateChange(
    interaction:
      Pick<EventDropArg, "event" | "revert"> | Pick<EventResizeDoneArg, "event" | "revert">,
  ): Promise<void> {
    const reminder = interaction.event.extendedProps.itemType === "reminder";
    const reminderInput = reminder ? getReminderDueInput(interaction.event) : null;
    const scheduledWorkInput = reminder ? null : getScheduledWorkDateInput(interaction.event);

    if (!reminderInput && !scheduledWorkInput) {
      interaction.revert();
      notifications.show({
        color: "red",
        title: "Spostamento non riuscito",
        message: "La nuova data non è valida in Europe/Rome.",
      });
      return;
    }

    const result = reminderInput
      ? await updateReminderDue(reminderInput)
      : scheduledWorkInput
        ? await updateScheduledWorkDates(scheduledWorkInput)
        : { error: "La nuova data non è valida." };
    if (result.error) {
      interaction.revert();
      notifications.show({ color: "red", title: "Modifica non salvata", message: result.error });
      return;
    }

    notifications.show({ color: "green", message: result.success });
    refreshAction();
  }

  function handleDateClick({ dateStr }: DateClickArg): void {
    openScheduledWorkModal(getDateClickPreset(dateStr.slice(0, 10)));
  }

  return (
    <Paper withBorder p={{ base: "sm", sm: "lg" }} className="dashboard-calendar">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <div>
            <Group gap="xs" wrap="nowrap">
              <IconCalendarMonth size={25} color="var(--mantine-color-blue-6)" aria-hidden="true" />
              <Title order={2} size="h3">
                Calendario
              </Title>
            </Group>
            <Text c="dimmed" size="sm">
              Lavori e promemoria · Europe/Rome.
            </Text>
          </div>
          <Group gap="xs">
            <CalendarExportMenu
              sectorId={sector.id}
              calendarDate={calendarDate}
              groupIds={groups.map((group) => group.id)}
            />
            <Button
              leftSection={<IconPlus size={18} aria-hidden="true" />}
              onClick={() => openScheduledWorkModal(getDefaultPreset())}
            >
              Nuovo lavoro
            </Button>
          </Group>
        </Group>

        {groups.length === 0 ? (
          <Text c="dimmed" className="scheduled-work-empty-groups">
            Prima crea un gruppo attivo da “Gestisci struttura”; poi potrai programmare i lavori.
          </Text>
        ) : calendarItems.length === 0 ? (
          <Text c="dimmed" className="scheduled-work-empty-groups">
            Il calendario è vuoto. Clicca un giorno oppure usa “Nuovo lavoro” per iniziare.
          </Text>
        ) : null}

        <div className="scheduled-work-calendar-container">
          <FullCalendar
            key={calendarScopeKey}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            initialDate={calendarDate}
            locale={itLocale}
            firstDay={1}
            headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
            buttonText={{ today: "Oggi" }}
            events={calendarItems.map(toFullCalendarEvent)}
            editable
            selectable={false}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventDrop={(info) => void persistDateChange(info)}
            eventResize={(info) => void persistDateChange(info)}
            datesSet={handleDatesSet}
            eventContent={EventContent}
            dayMaxEvents
            fixedWeekCount={false}
            height="auto"
            nowIndicator
          />
        </div>
      </Stack>

      {modalState?.type === "scheduledWork" ? (
        <ScheduledWorkFormModal
          key={modalState.key}
          opened
          sectorId={sector.id}
          groups={workGroupOptions}
          preferredGroupId={preferredGroupId}
          item={modalState.item}
          preset={modalState.preset}
          onClose={() => setModalState(null)}
          refreshAction={refreshAction}
        />
      ) : null}

      {modalState?.type === "reminder" ? (
        <ReminderFormModal
          key={modalState.key}
          opened
          sectorId={sector.id}
          nodes={workGroupOptions}
          assigneeOptions={assigneeOptions}
          currentUserId={currentUserId}
          preferredNodeId={preferredGroupId}
          item={modalState.item}
          onClose={() => setModalState(null)}
          refreshAction={refreshAction}
        />
      ) : null}
    </Paper>
  );
}
