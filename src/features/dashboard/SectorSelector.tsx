"use client";

import { Select } from "@mantine/core";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { Sector } from "@/features/auth/auth.types";

type SectorSelectorProps = Readonly<{
  sectors: readonly Sector[];
  activeSector?: Sector;
  calendarDate?: string;
  onChangeComplete?: () => void;
}>;

export function SectorSelector({
  sectors,
  activeSector,
  calendarDate,
  onChangeComplete,
}: SectorSelectorProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function selectSector(sectorCode: string | null): void {
    if (!sectorCode) {
      return;
    }

    const nextParams = new URLSearchParams(
      pathname === "/dashboard" ? undefined : searchParams.toString(),
    );
    nextParams.set("sector", sectorCode);
    nextParams.delete("page");
    nextParams.delete("group");
    if (calendarDate) {
      nextParams.set("date", calendarDate);
    }

    onChangeComplete?.();
    router.push(`${pathname}?${nextParams.toString()}`);
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
