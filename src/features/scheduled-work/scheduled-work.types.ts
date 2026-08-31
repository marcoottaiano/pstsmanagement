import type { EventInput } from "@fullcalendar/core";
import { z } from "zod";

import {
  createScheduledWorkSchema,
  deleteScheduledWorkSchema,
  scheduledWorkDatabaseSchema,
  updateScheduledWorkDatesSchema,
  updateScheduledWorkSchema,
} from "./scheduled-work.schemas";

export type ScheduledWork = z.infer<typeof scheduledWorkDatabaseSchema>;
export type CreateScheduledWorkInput = z.infer<typeof createScheduledWorkSchema>;
export type UpdateScheduledWorkInput = z.infer<typeof updateScheduledWorkSchema>;
export type DeleteScheduledWorkInput = z.infer<typeof deleteScheduledWorkSchema>;
export type UpdateScheduledWorkDatesInput = z.infer<typeof updateScheduledWorkDatesSchema>;

export type ScheduledWorkGroup = Readonly<{
  id: string;
  name: string;
  isArchived: boolean;
}>;

export type ScheduledWorkCalendarItem = ScheduledWork &
  Readonly<{
    itemType: "scheduledWork";
    groups: readonly ScheduledWorkGroup[];
  }>;

export type ScheduledWorkEventInput = EventInput &
  Readonly<{
    extendedProps: {
      itemId: string;
      itemType: "scheduledWork";
      sectorId: string;
      groupIds: readonly string[];
      groupName: string;
      description: string | null;
    };
  }>;

export type ScheduledWorkActionResult = Readonly<{
  error?: string;
  success?: string;
}>;
