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

export type CalendarItem = ScheduledWork &
  Readonly<{
    groupName: string;
  }>;

export type ScheduledWorkEventInput = EventInput &
  Readonly<{
    extendedProps: {
      sectorId: string;
      groupId: string;
      groupName: string;
      description: string | null;
    };
  }>;

export type ScheduledWorkActionResult = Readonly<{
  error?: string;
  success?: string;
}>;
