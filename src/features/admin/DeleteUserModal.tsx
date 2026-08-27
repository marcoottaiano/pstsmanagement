"use client";

import { Alert, Button, Group, Modal, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteUser } from "./admin.actions";
import type { ManagedUser } from "./admin.types";

type DeleteUserModalProps = Readonly<{
  user: ManagedUser;
  onClose: () => void;
}>;

export function DeleteUserModal({ user, onClose }: DeleteUserModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleDelete(): Promise<void> {
    setIsSubmitting(true);
    const result = await deleteUser({ userId: user.id });
    setIsSubmitting(false);

    if (result.error) {
      notifications.show({
        color: "red",
        title: "Utente non eliminato",
        message: result.error,
      });
      return;
    }

    notifications.show({ color: "green", message: result.success });
    onClose();
    router.refresh();
  }

  return (
    <Modal
      opened
      onClose={onClose}
      title="Elimina utente"
      centered
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <Stack gap="md">
        <Alert color="red" icon={<IconAlertTriangle size={18} aria-hidden="true" />}>
          Questa operazione è definitiva e rimuoverà l’account e i relativi accessi.
        </Alert>
        <div>
          <Text>
            Vuoi eliminare{" "}
            <Text span fw={600}>
              {user.displayName}
            </Text>
            ?
          </Text>
          <Text c="dimmed" size="sm">
            {user.email}
          </Text>
        </div>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={isSubmitting}>
            Annulla
          </Button>
          <Button color="red" loading={isSubmitting} onClick={() => void handleDelete()}>
            Elimina definitivamente
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
