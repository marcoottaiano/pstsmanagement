"use client";

import { ActionIcon, Menu, Tooltip } from "@mantine/core";
import { IconDownload, IconFileSpreadsheet, IconFileTypePdf } from "@tabler/icons-react";

type CalendarExportMenuProps = Readonly<{
  sectorId: string;
  calendarDate: string;
  groupIds: readonly string[];
}>;

export function CalendarExportMenu({ sectorId, calendarDate, groupIds }: CalendarExportMenuProps) {
  function getExportUrl(format: "pdf" | "xlsx"): string {
    const searchParams = new URLSearchParams({
      sector: sectorId,
      date: calendarDate,
      format,
    });
    if (groupIds.length > 0) {
      searchParams.set("groups", groupIds.join(","));
    }
    return `/api/export/calendar?${searchParams.toString()}`;
  }

  return (
    <Menu position="bottom-end" shadow="md" width={220} withinPortal>
      <Menu.Target>
        <Tooltip label="Esporta calendario">
          <ActionIcon variant="default" size="lg" aria-label="Esporta calendario">
            <IconDownload size={18} aria-hidden="true" />
          </ActionIcon>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Calendario mensile</Menu.Label>
        <Menu.Item
          component="a"
          href={getExportUrl("pdf")}
          leftSection={<IconFileTypePdf size={17} />}
        >
          Esporta PDF
        </Menu.Item>
        <Menu.Item
          component="a"
          href={getExportUrl("xlsx")}
          leftSection={<IconFileSpreadsheet size={17} />}
        >
          Esporta Excel
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
