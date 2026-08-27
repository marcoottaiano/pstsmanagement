"use client";

import { Button, Checkbox, Group, Modal, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Sector } from "@/features/auth/auth.types";

import { setUserSectorAccess } from "./admin.actions";
import { setUserSectorAccessSchema } from "./admin.schemas";
import type { ManagedUser } from "./admin.types";

type UserAccessModalProps = Readonly<{
  user: ManagedUser;
  sectors: readonly Sector[];
  onClose: () => void;
}>;

export function UserAccessModal({ user, sectors, onClose }: UserAccessModalProps) {
  const router = useRouter();
  const [sectorIds, setSectorIds] = useState<string[]>([...user.sectorIds]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(): Promise<void> {
    const parsed = setUserSectorAccessSchema.safeParse({ userId: user.id, sectorIds });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Seleziona almeno un settore.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    const result = await setUserSectorAccess(parsed.data);
    setIsSubmitting(false);

    if (result.error) {
      notifications.show({
        color: "red",
        title: "Accessi non aggiornati",
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
      title="Gestisci accessi"
      centered
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <Stack gap="md">
        <div>
          <Text fw={600}>{user.displayName}</Text>
          <Text c="dimmed" size="sm">
            {user.email}
          </Text>
        </div>
        <Checkbox.Group
          value={sectorIds}
          onChange={(values) => {
            setSectorIds(values);
            setError(null);
          }}
          label="Settori accessibili"
          description="L’utente deve avere accesso ad almeno un settore."
          error={error}
          required
        >
          <Stack gap="xs" mt="xs">
            {sectors.map((sector) => (
              <Checkbox key={sector.id} value={sector.id} label={sector.name} />
            ))}
          </Stack>
        </Checkbox.Group>
        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={onClose} disabled={isSubmitting}>
            Annulla
          </Button>
          <Button loading={isSubmitting} onClick={() => void handleSubmit()}>
            Salva accessi
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
