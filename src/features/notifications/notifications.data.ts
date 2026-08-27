import { getAuthenticatedContext } from "@/features/auth/auth.data";
import { formatReminderDue, getRomeDayKey } from "@/features/reminders/reminders.dates";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TablesInsert } from "@/types/database.types";

import {
  existingGeneratedNotificationSchema,
  notificationAssigneeSchema,
  notificationReminderSchema,
  notificationRowSchema,
} from "./notifications.schemas";
import type { NotificationFeed, NotificationItem, NotificationKind } from "./notifications.types";

const NOTIFICATION_LIMIT = 20;
const DUE_SOON_WINDOW_MS = 24 * 60 * 60 * 1_000;
const GENERATED_KINDS: readonly NotificationKind[] = [
  "REMINDER_ASSIGNED",
  "REMINDER_DUE_SOON",
  "REMINDER_OVERDUE",
];

type NotificationInsert = TablesInsert<"notifications">;
type GeneratedNotificationInsert = NotificationInsert & Readonly<{ kind: NotificationKind }>;
type ReminderForNotification = ReturnType<typeof notificationReminderSchema.parse>;

function getNotificationKey(reminderId: string, kind: NotificationKind): string {
  return `${reminderId}:${kind}`;
}

function createNotificationInsert(
  recipientId: string,
  reminder: ReminderForNotification,
  kind: NotificationKind,
): GeneratedNotificationInsert {
  const dueLabel = reminder.due_at
    ? formatReminderDue(reminder.due_at, reminder.due_all_day)
    : null;
  const presentation = {
    REMINDER_ASSIGNED: {
      title: "Nuovo promemoria assegnato",
      message: dueLabel
        ? `Ti è stato assegnato “${reminder.title}”, con scadenza ${dueLabel}.`
        : `Ti è stato assegnato “${reminder.title}”.`,
    },
    REMINDER_DUE_SOON: {
      title: "Scadenza imminente",
      message: `“${reminder.title}” scade ${dueLabel ?? "a breve"}.`,
    },
    REMINDER_OVERDUE: {
      title: "Scadenza superata",
      message: `“${reminder.title}” è scaduto ${dueLabel ?? ""}.`.trim(),
    },
  } satisfies Record<NotificationKind, Readonly<{ title: string; message: string }>>;

  return {
    recipient_id: recipientId,
    reminder_id: reminder.id,
    sector_id: reminder.sector_id,
    kind,
    due_at: reminder.due_at,
    ...presentation[kind],
  };
}

async function synchronizeNotifications(userId: string): Promise<void> {
  const context = await getAuthenticatedContext();
  if (!context || context.identity.id !== userId) {
    return;
  }

  const adminClient = createAdminClient();
  const assigneesResult = await adminClient
    .from("reminder_assignees")
    .select("reminder_id")
    .eq("user_id", userId);

  if (assigneesResult.error) {
    throw new Error(`Impossibile leggere le assegnazioni: ${assigneesResult.error.message}`);
  }

  const parsedAssignees = notificationAssigneeSchema.array().safeParse(assigneesResult.data);
  if (!parsedAssignees.success) {
    throw new Error("Le assegnazioni restituite dal database non sono valide.");
  }

  const assignedReminderIds = parsedAssignees.data.map((row) => row.reminder_id);
  const createdRemindersResult = await adminClient
    .from("reminders")
    .select("id, sector_id, title, due_at, due_all_day, created_by")
    .eq("created_by", userId)
    .eq("status", "OPEN");

  if (createdRemindersResult.error) {
    throw new Error(
      `Impossibile leggere i promemoria creati: ${createdRemindersResult.error.message}`,
    );
  }

  const createdReminders = notificationReminderSchema
    .array()
    .safeParse(createdRemindersResult.data);
  if (!createdReminders.success) {
    throw new Error("I promemoria restituiti dal database non sono validi.");
  }

  let assignedReminders: readonly ReminderForNotification[] = [];
  if (assignedReminderIds.length > 0) {
    const assignedRemindersResult = await adminClient
      .from("reminders")
      .select("id, sector_id, title, due_at, due_all_day, created_by")
      .in("id", assignedReminderIds)
      .eq("status", "OPEN");

    if (assignedRemindersResult.error) {
      throw new Error(
        `Impossibile leggere i promemoria assegnati: ${assignedRemindersResult.error.message}`,
      );
    }

    const parsedAssignedReminders = notificationReminderSchema
      .array()
      .safeParse(assignedRemindersResult.data);
    if (!parsedAssignedReminders.success) {
      throw new Error("I promemoria assegnati restituiti dal database non sono validi.");
    }
    assignedReminders = parsedAssignedReminders.data;
  }

  const accessibleSectorIds = new Set(context.sectors.map((sector) => sector.id));
  const assignedReminderIdSet = new Set(assignedReminderIds);
  const reminderById = new Map<string, ReminderForNotification>();
  for (const reminder of [...createdReminders.data, ...assignedReminders]) {
    if (accessibleSectorIds.has(reminder.sector_id)) {
      reminderById.set(reminder.id, reminder);
    }
  }

  const now = Date.now();
  const desiredNotifications = new Map<string, GeneratedNotificationInsert>();
  for (const reminder of reminderById.values()) {
    if (assignedReminderIdSet.has(reminder.id) && reminder.created_by !== userId) {
      const assignment = createNotificationInsert(userId, reminder, "REMINDER_ASSIGNED");
      desiredNotifications.set(getNotificationKey(reminder.id, assignment.kind), assignment);
    }

    if (!reminder.due_at) {
      continue;
    }

    const dueTime = new Date(reminder.due_at).getTime();
    const dueKind =
      dueTime < now
        ? "REMINDER_OVERDUE"
        : dueTime <= now + DUE_SOON_WINDOW_MS
          ? "REMINDER_DUE_SOON"
          : null;
    if (dueKind) {
      const deadline = createNotificationInsert(userId, reminder, dueKind);
      desiredNotifications.set(getNotificationKey(reminder.id, deadline.kind), deadline);
    }
  }

  const existingResult = await adminClient
    .from("notifications")
    .select("id, reminder_id, kind")
    .eq("recipient_id", userId)
    .in("kind", [...GENERATED_KINDS]);

  if (existingResult.error) {
    throw new Error(`Impossibile leggere le notifiche esistenti: ${existingResult.error.message}`);
  }

  const existingNotifications = existingGeneratedNotificationSchema
    .array()
    .safeParse(existingResult.data);
  if (!existingNotifications.success) {
    throw new Error("Le notifiche esistenti restituite dal database non sono valide.");
  }

  const staleNotificationIds = existingNotifications.data
    .filter(
      (notification) =>
        !desiredNotifications.has(getNotificationKey(notification.reminder_id, notification.kind)),
    )
    .map((notification) => notification.id);

  const writes: PromiseLike<{ error: Readonly<{ message: string }> | null }>[] = [];
  const desiredRows = [...desiredNotifications.values()];
  if (desiredRows.length > 0) {
    writes.push(
      adminClient
        .from("notifications")
        .upsert(desiredRows, { onConflict: "recipient_id,reminder_id,kind" }),
    );
  }
  if (staleNotificationIds.length > 0) {
    writes.push(adminClient.from("notifications").delete().in("id", staleNotificationIds));
  }

  const writeResults = await Promise.all(writes);
  const writeError = writeResults.find((result) => result.error)?.error;
  if (writeError) {
    throw new Error(`Impossibile sincronizzare le notifiche: ${writeError.message}`);
  }
}

export async function getNotificationFeed(): Promise<NotificationFeed> {
  const context = await getAuthenticatedContext();
  if (!context) {
    return { items: [], unreadCount: 0 };
  }

  const userId = context.identity.id;
  await synchronizeNotifications(userId);

  const adminClient = createAdminClient();
  const [itemsResult, countResult] = await Promise.all([
    adminClient
      .from("notifications")
      .select("id, reminder_id, sector_id, kind, title, message, due_at, created_at, read_at")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(NOTIFICATION_LIMIT),
    adminClient
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", userId)
      .is("read_at", null),
  ]);

  if (itemsResult.error || countResult.error) {
    throw new Error(
      `Impossibile caricare le notifiche: ${itemsResult.error?.message ?? countResult.error?.message}`,
    );
  }

  const parsedItems = notificationRowSchema.array().safeParse(itemsResult.data);
  if (!parsedItems.success) {
    throw new Error("Le notifiche restituite dal database non sono valide.");
  }

  const sectorCodeById = new Map(context.sectors.map((sector) => [sector.id, sector.code]));
  const items: NotificationItem[] = parsedItems.data.flatMap((notification) => {
    const sectorCode = sectorCodeById.get(notification.sectorId);
    if (!sectorCode) {
      return [];
    }

    const date = notification.dueAt ? getRomeDayKey(notification.dueAt) : getRomeDayKey();
    return [
      {
        ...notification,
        href: `/dashboard?sector=${sectorCode}&date=${date}`,
      },
    ];
  });

  return { items, unreadCount: countResult.count ?? 0 };
}
