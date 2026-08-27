import { z } from "zod";

import type { UserAvatar } from "@/features/avatar/avatar";

import {
  createReminderSchema,
  deleteReminderSchema,
  reminderDatabaseSchema,
  reminderPrioritySchema,
  reminderStatusSchema,
  updateReminderDueSchema,
  updateReminderSchema,
  updateReminderStatusSchema,
} from "./reminders.schemas";

export type ReminderStatus = z.infer<typeof reminderStatusSchema>;
export type ReminderPriority = z.infer<typeof reminderPrioritySchema>;
export type ReminderRecord = z.infer<typeof reminderDatabaseSchema>;
export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;
export type UpdateReminderStatusInput = z.infer<typeof updateReminderStatusSchema>;
export type UpdateReminderDueInput = z.infer<typeof updateReminderDueSchema>;
export type DeleteReminderInput = z.infer<typeof deleteReminderSchema>;

export type ReminderPerson = Readonly<{
  id: string;
  displayName: string;
  email: string | null;
  initials: string;
  avatar: UserAvatar;
}>;

export type Reminder = ReminderRecord &
  Readonly<{
    groupName: string | null;
    assignees: readonly ReminderPerson[];
  }>;

export type ReminderCalendarItem = Reminder & Readonly<{ itemType: "reminder" }>;

export type ReminderActionResult = Readonly<{
  error?: string;
  success?: string;
}>;
