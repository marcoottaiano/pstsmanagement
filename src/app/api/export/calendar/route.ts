import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { NextResponse } from "next/server";

import { authorizeExportSector } from "@/features/exports/export.auth";
import {
  createCalendarExcel,
  createCalendarPdf,
  type CalendarExportItem,
} from "@/features/exports/calendar-export";
import { calendarExportQuerySchema } from "@/features/exports/export.schemas";
import { getGroupNodes } from "@/features/groups/groups.data";
import { getVisibleReminders } from "@/features/reminders/reminders.data";
import { getScheduledWorkForVisibleRange } from "@/features/scheduled-work/scheduled-work.data";
import { getScheduledWorkGroupNames } from "@/features/scheduled-work/scheduled-work.mapper";
import {
  getVisibleMonthRange,
  isValidCalendarDate,
  ROME_TIME_ZONE,
} from "@/features/scheduled-work/scheduled-work.dates";

dayjs.extend(utc);
dayjs.extend(timezone);

export const runtime = "nodejs";

function getMonthLabel(date: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    month: "long",
    year: "numeric",
    timeZone: ROME_TIME_ZONE,
  }).format(new Date(`${date}T12:00:00`));
}

function formatDate(value: string, allDay: boolean): string {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    ...(allDay ? {} : { timeStyle: "short" }),
    timeZone: ROME_TIME_ZONE,
  }).format(new Date(value));
}

export async function GET(request: Request): Promise<Response> {
  const searchParams = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = calendarExportQuerySchema.safeParse(searchParams);
  if (!parsed.success || !isValidCalendarDate(parsed.data?.date)) {
    return NextResponse.json({ error: "Parametri di esportazione non validi." }, { status: 400 });
  }

  const authorization = await authorizeExportSector(parsed.data.sector);
  if ("response" in authorization) {
    return authorization.response;
  }

  const nodes = await getGroupNodes(authorization.sector.id);
  const groups = nodes;
  const allowedGroupIds = new Set(groups.map((group) => group.id));
  const selectedGroupIds = parsed.data.groups.filter((groupId) => allowedGroupIds.has(groupId));
  const groupIds = selectedGroupIds.length > 0 ? selectedGroupIds : groups.map((group) => group.id);
  const groupNames = new Map(groups.map((group) => [group.id, group.name]));
  const range = getVisibleMonthRange(parsed.data.date);
  const [scheduledWork, reminders] = await Promise.all([
    getScheduledWorkForVisibleRange(authorization.sector.id, groupIds, range.startAt, range.endAt),
    getVisibleReminders(authorization.sector.id, groupIds, groupNames),
  ]);
  const calendarItems: readonly CalendarExportItem[] = [
    ...scheduledWork.map((item) => ({
      title: item.title,
      type: "Lavoro programmato" as const,
      date: formatDate(item.startAt, item.allDay),
      groupName: getScheduledWorkGroupNames(item.groups),
    })),
    ...reminders
      .filter(
        (item) =>
          item.dueAt !== null &&
          dayjs(item.dueAt).isAfter(range.startAt) &&
          dayjs(item.dueAt).isBefore(range.endAt),
      )
      .map((item) => ({
        title: item.title,
        type: "Promemoria" as const,
        date: formatDate(item.dueAt as string, item.dueAllDay),
        groupName: item.groupName,
      })),
  ].sort((left, right) => left.date.localeCompare(right.date, "it"));
  const documentData = {
    sectorName: authorization.sector.name,
    monthLabel: getMonthLabel(parsed.data.date),
    items: calendarItems,
  };
  const pdf = parsed.data.format === "pdf";
  const body = pdf ? createCalendarPdf(documentData) : await createCalendarExcel(documentData);

  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": pdf
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="calendario-${parsed.data.date}.${parsed.data.format}"`,
    },
  });
}
