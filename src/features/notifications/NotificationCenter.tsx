import { cache } from "react";

import { NotificationCenterClient } from "./NotificationCenterClient";
import { getNotificationFeed } from "./notifications.data";
import type { NotificationFeed } from "./notifications.types";

const loadNotificationFeed = cache(async (): Promise<NotificationFeed> => {
  try {
    return await getNotificationFeed();
  } catch (error) {
    console.error("Notification center load failed.", error);
    return { items: [], unreadCount: 0 };
  }
});

type NotificationCenterProps = Readonly<{
  variant?: "icon" | "menu";
}>;

export async function NotificationCenter({ variant = "icon" }: NotificationCenterProps) {
  const feed = await loadNotificationFeed();
  return (
    <NotificationCenterClient items={feed.items} unreadCount={feed.unreadCount} variant={variant} />
  );
}
