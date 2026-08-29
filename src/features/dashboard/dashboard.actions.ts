"use server";

import { z } from "zod";

import { getAuthenticatedContext } from "@/features/auth/auth.data";
import { getGroupNodes } from "@/features/groups/groups.data";

import { getDashboardData } from "./dashboard.data";

const loadDashboardDataSchema = z.object({
  sectorId: z.string().uuid(),
  calendarDate: z.iso.date(),
});

export async function loadDashboardDataAction(input: { sectorId: string; calendarDate: string }) {
  const parsed = loadDashboardDataSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Non è stato possibile caricare i dati richiesti.");
  }

  const context = await getAuthenticatedContext();
  const sector = context?.sectors.find((candidate) => candidate.id === parsed.data.sectorId);
  if (!sector) {
    throw new Error("Non è stato possibile caricare i dati richiesti.");
  }

  const nodes = await getGroupNodes(sector.id);
  return getDashboardData(sector, nodes, parsed.data.calendarDate);
}
