"use client";

import type { EventClickArg, EventContentArg, EventDropArg, DatesSetArg } from "@fullcalendar/core";
import itLocale from "@fullcalendar/core/locales/it";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, {
  type DateClickArg,
  type EventResizeDoneArg,
} from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import { Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPlus } from "@tabler/icons-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import type { Sector } from "@/features/auth/auth.types";
import type { GroupNode } from "@/features/groups/groups.types";

import { updateScheduledWorkDates } from "./scheduled-work.actions";
import { romeDateTimeToIso, roundCurrentRomeTime } from "./scheduled-work.dates";
import { toFullCalendarEvent } from "./scheduled-work.mapper";
import type { CalendarItem, UpdateScheduledWorkDatesInput } from "./scheduled-work.types";
import { ScheduledWorkFormModal, type ScheduledWorkPreset } from "./ScheduledWorkFormModal";

type ScheduledWorkCalendarProps = Readonly<{
  sector: Sector;
  calendarDate: string;
  items: readonly CalendarItem[];
  groups: readonly GroupNode[];
  preferredGroupId: string | null;
}>;

type ModalState = Readonly<{
  item: CalendarItem | null;
  preset: ScheduledWorkPreset;
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

function getEventDateInput(event: EventDropArg["event"]): UpdateScheduledWorkDatesInput | null {
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
    id: event.id,
    sectorId: String(event.extendedProps.sectorId),
    startAt,
    endAt,
    allDay: event.allDay,
  };
}

function EventContent({ event, timeText }: EventContentArg) {
  return (
    <span className="scheduled-work-event-content">
      {timeText ? <span className="scheduled-work-event-time">{timeText}</span> : null}
      <span className="scheduled-work-event-title">{event.title}</span>
      <span className="scheduled-work-event-group">{String(event.extendedProps.groupName)}</span>
    </span>
  );
}

export function ScheduledWorkCalendar({
  sector,
  calendarDate,
  items,
  groups,
  preferredGroupId,
}: ScheduledWorkCalendarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [modalState, setModalState] = useState<ModalState | null>(null);

  function openCreateModal(preset: ScheduledWorkPreset): void {
    setModalState({ item: null, preset, key: `create-${Date.now()}` });
  }

  function handleEventClick({ event }: EventClickArg): void {
    const item = items.find((candidate) => candidate.id === event.id);
    if (item) {
      setModalState({ item, preset: getDefaultPreset(), key: `edit-${item.id}` });
    }
  }

  function handleDatesSet({ view }: DatesSetArg): void {
    const nextDate = getCalendarMonthDate(view.currentStart);
    if (nextDate.slice(0, 7) === calendarDate.slice(0, 7)) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("sector", sector.code);
    nextParams.set("date", nextDate);
    nextParams.delete("selection");
    nextParams.delete("groupNotice");
    router.push(`/dashboard?${nextParams.toString()}`);
  }

  async function persistDateChange(
    interaction:
      Pick<EventDropArg, "event" | "revert"> | Pick<EventResizeDoneArg, "event" | "revert">,
  ): Promise<void> {
    const input = getEventDateInput(interaction.event);
    if (!input) {
      interaction.revert();
      notifications.show({
        color: "red",
        title: "Spostamento non riuscito",
        message: "La nuova data non è valida in Europe/Rome.",
      });
      return;
    }

    const result = await updateScheduledWorkDates(input);
    if (result.error) {
      interaction.revert();
      notifications.show({ color: "red", title: "Modifica non salvata", message: result.error });
      return;
    }

    notifications.show({ color: "green", message: result.success });
    router.refresh();
  }

  function handleDateClick({ dateStr }: DateClickArg): void {
    openCreateModal(getDateClickPreset(dateStr.slice(0, 10)));
  }

  return (
    <Paper withBorder p={{ base: "sm", sm: "lg" }} className="dashboard-calendar">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <div>
            <Title order={2} size="h3">
              Lavori programmati
            </Title>
            <Text c="dimmed" size="sm">
              Orari visualizzati nel fuso Europe/Rome.
            </Text>
          </div>
          <Button
            leftSection={<IconPlus size={18} aria-hidden="true" />}
            onClick={() => openCreateModal(getDefaultPreset())}
          >
            Nuovo lavoro
          </Button>
        </Group>

        {groups.length === 0 ? (
          <Text c="dimmed" className="scheduled-work-empty-groups">
            Crea o seleziona almeno un GROUP attivo per programmare i lavori.
          </Text>
        ) : null}

        <div className="scheduled-work-calendar-container">
          <FullCalendar
            key={calendarDate}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            initialDate={calendarDate}
            locale={itLocale}
            firstDay={1}
            headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
            buttonText={{ today: "Oggi" }}
            events={items.map(toFullCalendarEvent)}
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

      {modalState ? (
        <ScheduledWorkFormModal
          key={modalState.key}
          opened
          sectorId={sector.id}
          groups={groups}
          preferredGroupId={preferredGroupId}
          item={modalState.item}
          preset={modalState.preset}
          onClose={() => setModalState(null)}
        />
      ) : null}
    </Paper>
  );
}
