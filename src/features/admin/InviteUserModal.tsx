"use client";

import { Button, Checkbox, Group, Modal, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Sector } from "@/features/auth/auth.types";

import { inviteUser } from "./admin.actions";
import { inviteUserSchema } from "./admin.schemas";

type InviteUserModalProps = Readonly<{
  opened: boolean;
  sectors: readonly Sector[];
  onClose: () => void;
}>;

type InviteUserFormValues = {
  displayName: string;
  email: string;
  sectorIds: string[];
};

function getFieldErrors(issues: readonly { path: PropertyKey[]; message: string }[]) {
  return Object.fromEntries(
    issues.map((issue) => [String(issue.path[0] ?? "email"), issue.message]),
  );
}

export function InviteUserModal({ opened, sectors, onClose }: InviteUserModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<InviteUserFormValues>({
    mode: "controlled",
    initialValues: { displayName: "", email: "", sectorIds: [] },
  });

  function closeModal(): void {
    form.reset();
    form.clearErrors();
    onClose();
  }

  async function handleSubmit(values: InviteUserFormValues): Promise<void> {
    form.clearErrors();
    const parsed = inviteUserSchema.safeParse(values);
    if (!parsed.success) {
      form.setErrors(getFieldErrors(parsed.error.issues));
      return;
    }

    setIsSubmitting(true);
    const result = await inviteUser(parsed.data);
    setIsSubmitting(false);

    if (result.error) {
      notifications.show({
        color: "red",
        title: "Invito non inviato",
        message: result.error,
      });
      return;
    }

    notifications.show({ color: "green", message: result.success });
    closeModal();
    router.refresh();
  }

  return (
    <Modal
      opened={opened}
      onClose={closeModal}
      title="Invita un nuovo utente"
      centered
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
        <Stack gap="md">
          <TextInput
            label="Nome e cognome"
            placeholder="Mario Rossi"
            required
            maxLength={100}
            {...form.getInputProps("displayName")}
          />
          <TextInput
            label="Email"
            placeholder="nome@esempio.it"
            type="email"
            required
            {...form.getInputProps("email")}
          />
          <Checkbox.Group
            label="Settori accessibili"
            description="Seleziona almeno un settore."
            required
            {...form.getInputProps("sectorIds")}
          >
            <Stack gap="xs" mt="xs">
              {sectors.map((sector) => (
                <Checkbox key={sector.id} value={sector.id} label={sector.name} />
              ))}
            </Stack>
          </Checkbox.Group>
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={closeModal} disabled={isSubmitting}>
              Annulla
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Invia invito
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
