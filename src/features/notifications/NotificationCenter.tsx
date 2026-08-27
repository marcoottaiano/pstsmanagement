import { NotificationCenterClient } from "./NotificationCenterClient";
import { getNotificationFeed } from "./notifications.data";
import type { NotificationFeed } from "./notifications.types";

async function loadNotificationFeed(): Promise<NotificationFeed> {
  try {
    return await getNotificationFeed();
  } catch (error) {
    console.error("Notification center load failed.", error);
    return { items: [], unreadCount: 0 };
  }
}

export async function NotificationCenter() {
  const feed = await loadNotificationFeed();
  return <NotificationCenterClient items={feed.items} unreadCount={feed.unreadCount} />;
}
