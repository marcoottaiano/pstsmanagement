import { z } from "zod";

import { notificationKindSchema, notificationRowSchema } from "./notifications.schemas";

export type NotificationKind = z.infer<typeof notificationKindSchema>;
type NotificationRecord = z.infer<typeof notificationRowSchema>;

export type NotificationItem = NotificationRecord &
  Readonly<{
    href: string;
  }>;

export type NotificationFeed = Readonly<{
  items: readonly NotificationItem[];
  unreadCount: number;
}>;

export type NotificationActionResult = Readonly<{
  error?: string;
}>;
