"use client";

import {
  Button,
  Group,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { GroupNode } from "@/features/groups/groups.types";

import { createObjective, deleteObjective, updateObjective } from "./objectives.actions";
import { createObjectiveSchema, updateObjectiveSchema } from "./objectives.schemas";
import type { Objective } from "./objectives.types";

type ObjectiveFormModalProps = Readonly<{
  opened: boolean;
  sectorId: string;
  groups: readonly GroupNode[];
  preferredGroupId: string | null;
  item: Objective | null;
  onClose: () => void;
}>;

type FormValues = {
  title: string;
  description: string;
  groupId: string;
  status: string;
  periodStart: string;
  periodEnd: string;
};

const STATUS_OPTIONS = [
  { value: "NOT_STARTED", label: "Da iniziare" },
  { value: "IN_PROGRESS", label: "In corso" },
  { value: "POSTPONED", label: "Posticipato" },
  { value: "COMPLETED", label: "Completato" },
];

function getInitialValues(item: Objective | null, preferredGroupId: string | null): FormValues {
  return {
    title: item?.title ?? "",
    description: item?.description ?? "",
    groupId: item?.groupId ?? preferredGroupId ?? "",
    status: item?.status ?? "NOT_STARTED",
    periodStart: item?.periodStart ?? "",
    periodEnd: item?.periodEnd ?? "",
  };
}

function getFieldErrors(issues: readonly { path: PropertyKey[]; message: string }[]) {
  return Object.fromEntries(
    issues.map((issue) => [String(issue.path[0] ?? "title"), issue.message]),
  );
}

export function ObjectiveFormModal({
  opened,
  sectorId,
  groups,
  preferredGroupId,
  item,
  onClose,
}: ObjectiveFormModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeleteOpened, setConfirmDeleteOpened] = useState(false);
  const form = useForm<FormValues>({
    mode: "controlled",
    initialValues: getInitialValues(item, preferredGroupId),
  });

  async function handleSubmit(values: FormValues): Promise<void> {
    form.clearErrors();
    const commonInput = {
      sectorId,
      groupId: values.groupId,
      title: values.title,
      description: values.description.trim() || null,
      status: values.status,
      periodStart: values.periodStart || null,
      periodEnd: values.periodEnd || null,
    };
    setIsSubmitting(true);
    let result;
    if (item) {
      const parsed = updateObjectiveSchema.safeParse({ id: item.id, ...commonInput });
      if (!parsed.success) {
        setIsSubmitting(false);
        form.setErrors(getFieldErrors(parsed.error.issues));
        return;
      }
      result = await updateObjective(parsed.data);
    } else {
      const parsed = createObjectiveSchema.safeParse(commonInput);
      if (!parsed.success) {
        setIsSubmitting(false);
        form.setErrors(getFieldErrors(parsed.error.issues));
        return;
      }
      result = await createObjective(parsed.data);
    }
    setIsSubmitting(false);

    if (result.error) {
      notifications.show({
        color: "red",
        title: "Salvataggio non riuscito",
        message: result.error,
      });
      return;
    }

    notifications.show({ color: "green", message: result.success });
    onClose();
    router.refresh();
  }

  async function handleDelete(): Promise<void> {
    if (!item) {
      return;
    }

    setIsSubmitting(true);
    const result = await deleteObjective({ id: item.id, sectorId });
    setIsSubmitting(false);
    if (result.error) {
      notifications.show({
        color: "red",
        title: "Eliminazione non riuscita",
        message: result.error,
      });
      return;
    }

    notifications.show({ color: "green", message: result.success });
    setConfirmDeleteOpened(false);
    onClose();
    router.refresh();
  }

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        title={item ? "Modifica obiettivo" : "Nuovo obiettivo"}
        size="min(68rem, calc(100vw - 2rem))"
        closeOnClickOutside={!isSubmitting}
        closeOnEscape={!isSubmitting}
      >
        <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
          <Stack gap="md">
            <TextInput label="Titolo" required maxLength={200} {...form.getInputProps("title")} />
            <Textarea
              label="Descrizione"
              autosize
              minRows={3}
              maxLength={2_000}
              {...form.getInputProps("description")}
            />
            <Select
              label="Gruppo"
              required
              searchable
              data={groups.map((group) => ({ value: group.id, label: group.name }))}
              {...form.getInputProps("groupId")}
            />
            <Select label="Stato" data={STATUS_OPTIONS} {...form.getInputProps("status")} />
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <TextInput
                label="Inizio periodo"
                type="date"
                {...form.getInputProps("periodStart")}
              />
              <TextInput label="Fine periodo" type="date" {...form.getInputProps("periodEnd")} />
            </SimpleGrid>
            <Group justify="space-between">
              {item ? (
                <Button color="red" variant="light" onClick={() => setConfirmDeleteOpened(true)}>
                  Elimina
                </Button>
              ) : (
                <span />
              )}
              <Group>
                <Button variant="default" onClick={onClose} disabled={isSubmitting}>
                  Annulla
                </Button>
                <Button type="submit" loading={isSubmitting} disabled={groups.length === 0}>
                  Salva
                </Button>
              </Group>
            </Group>
          </Stack>
        </form>
      </Modal>
      <Modal
        opened={confirmDeleteOpened}
        onClose={() => setConfirmDeleteOpened(false)}
        title="Eliminare l'obiettivo?"
        centered
      >
        <Stack gap="md">
          <p>L&apos;eliminazione è definitiva.</p>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setConfirmDeleteOpened(false)}>
              Annulla
            </Button>
            <Button color="red" loading={isSubmitting} onClick={() => void handleDelete()}>
              Elimina definitivamente
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
