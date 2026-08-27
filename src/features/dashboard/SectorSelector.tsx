"use client";

import { Select } from "@mantine/core";
import { useRouter } from "next/navigation";

import type { Sector } from "@/features/auth/auth.types";

type SectorSelectorProps = Readonly<{
  sectors: readonly Sector[];
  activeSector?: Sector;
  calendarDate?: string;
}>;

export function SectorSelector({ sectors, activeSector, calendarDate }: SectorSelectorProps) {
  const router = useRouter();

  function selectSector(sectorCode: string | null): void {
    if (!sectorCode) {
      return;
    }

    router.push(`/dashboard?sector=${sectorCode}${calendarDate ? `&date=${calendarDate}` : ""}`);
  }

  return (
    <Select
      className="dashboard-sector-selector"
      aria-label="Seleziona il settore attivo"
      placeholder="Seleziona settore"
      data={sectors.map((sector) => ({ value: sector.code, label: sector.name }))}
      value={activeSector?.code ?? null}
      onChange={selectSector}
      allowDeselect={false}
      size="sm"
      w="100%"
    />
  );
}
