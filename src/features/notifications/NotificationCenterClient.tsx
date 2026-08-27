"use client";

import {
  ActionIcon,
  Button,
  Group,
  Indicator,
  Popover,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertTriangle,
  IconBell,
  IconBellOff,
  IconCheck,
  IconClock,
  IconUserCheck,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { markAllNotificationsRead, markNotificationRead } from "./notifications.actions";
import type { NotificationItem, NotificationKind } from "./notifications.types";

type NotificationCenterClientProps = Readonly<{
  items: readonly NotificationItem[];
  unreadCount: number;
}>;

const KIND_PRESENTATION: Record<
  NotificationKind,
  Readonly<{
    color: string;
    icon: typeof IconBell;
  }>
> = {
  REMINDER_ASSIGNED: { color: "blue", icon: IconUserCheck },
  REMINDER_DUE_SOON: { color: "orange", icon: IconClock },
  REMINDER_OVERDUE: { color: "red", icon: IconAlertTriangle },
};

export function NotificationCenterClient({ items, unreadCount }: NotificationCenterClientProps) {
  const router = useRouter();
  const [opened, setOpened] = useState(false);
  const [isPending, startTransition] = useTransition();
  const indicatorLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  function showActionError(error: string): void {
    notifications.show({ color: "red", title: "Notifica non aggiornata", message: error });
  }

  function openNotification(item: NotificationItem): void {
    startTransition(async () => {
      if (!item.readAt) {
        const result = await markNotificationRead({ notificationId: item.id });
        if (result.error) {
          showActionError(result.error);
          return;
        }
      }

      setOpened(false);
      router.push(item.href);
      router.refresh();
    });
  }

  function markAllAsRead(): void {
    startTransition(async () => {
      const result = await markAllNotificationsRead();
      if (result.error) {
        showActionError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-end"
      width="min(24rem, calc(100vw - 1.5rem))"
      shadow="md"
      withinPortal
    >
      <Popover.Target>
        <Indicator
          inline
          disabled={unreadCount === 0}
          label={indicatorLabel}
          size={18}
          color="red"
          offset={4}
        >
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            aria-label={
              unreadCount > 0
                ? `Notifiche: ${unreadCount} non lette`
                : "Notifiche: nessuna non letta"
            }
            onClick={() => setOpened((current) => !current)}
          >
            <IconBell size={20} aria-hidden="true" />
          </ActionIcon>
        </Indicator>
      </Popover.Target>

      <Popover.Dropdown p={0}>
        <Group justify="space-between" p="md" pb="sm">
          <div>
            <Text fw={700}>Notifiche</Text>
            <Text size="xs" c="dimmed">
              {unreadCount === 0 ? "Tutto letto" : `${unreadCount} da leggere`}
            </Text>
          </div>
          {unreadCount > 0 ? (
            <Button
              variant="subtle"
              size="compact-xs"
              leftSection={<IconCheck size={14} aria-hidden="true" />}
              loading={isPending}
              onClick={markAllAsRead}
            >
              Segna tutte
            </Button>
          ) : null}
        </Group>

        {items.length === 0 ? (
          <Stack align="center" gap="xs" px="md" py="xl">
            <ThemeIcon variant="light" color="gray" size="lg" radius="xl">
              <IconBellOff size={18} aria-hidden="true" />
            </ThemeIcon>
            <Text fw={650} size="sm">
              Nessuna notifica
            </Text>
            <Text c="dimmed" size="xs" ta="center">
              Qui compariranno assegnazioni e promemoria in scadenza.
            </Text>
          </Stack>
        ) : (
          <ScrollArea.Autosize mah={420} type="auto">
            <Stack gap={0}>
              {items.map((item) => {
                const presentation = KIND_PRESENTATION[item.kind];
                const NotificationIcon = presentation.icon;

                return (
                  <UnstyledButton
                    key={item.id}
                    className="notification-center-item"
                    data-unread={!item.readAt}
                    disabled={isPending}
                    onClick={() => openNotification(item)}
                  >
                    <Group align="flex-start" wrap="nowrap" gap="sm">
                      <ThemeIcon variant="light" color={presentation.color} size="lg" radius="xl">
                        <NotificationIcon size={17} aria-hidden="true" />
                      </ThemeIcon>
                      <Stack gap={3} className="notification-center-content">
                        <Group justify="space-between" gap="xs" wrap="nowrap">
                          <Text fw={item.readAt ? 600 : 750} size="sm">
                            {item.title}
                          </Text>
                          {!item.readAt ? (
                            <span
                              className="notification-center-unread-dot"
                              aria-label="Non letta"
                            />
                          ) : null}
                        </Group>
                        <Text size="xs" c="dimmed" lineClamp={2}>
                          {item.message}
                        </Text>
                      </Stack>
                    </Group>
                  </UnstyledButton>
                );
              })}
            </Stack>
          </ScrollArea.Autosize>
        )}
      </Popover.Dropdown>
    </Popover>
  );
}
