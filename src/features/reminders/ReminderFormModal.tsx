"use client";

import {
  Button,
  Group,
  Modal,
  MultiSelect,
  Select,
  SimpleGrid,
  Stack,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useState } from "react";

import type { GroupNode } from "@/features/groups/groups.types";

import { createReminder, deleteReminder, updateReminder } from "./reminders.actions";
import { reminderDueToFormParts, reminderDueToIso } from "./reminders.dates";
import { createReminderSchema, updateReminderSchema } from "./reminders.schemas";
import type { Reminder, ReminderPerson } from "./reminders.types";

type ReminderFormModalProps = Readonly<{
  opened: boolean;
  sectorId: string;
  nodes: readonly GroupNode[];
  assigneeOptions: readonly ReminderPerson[];
  currentUserId: string;
  preferredNodeId: string | null;
  item: Reminder | null;
  onClose: () => void;
  refreshAction: () => void;
}>;

type FormValues = {
  title: string;
  description: string;
  groupIds: string[];
  priority: string;
  assigneeIds: string[];
  dueDate: string;
  dueTime: string;
};

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Bassa" },
  { value: "NORMAL", label: "Normale" },
  { value: "HIGH", label: "Alta" },
];

function getInitialValues(
  item: Reminder | null,
  preferredNodeId: string | null,
  currentUserId: string,
  assigneeOptions: readonly ReminderPerson[],
): FormValues {
  if (!item) {
    return {
      title: "",
      description: "",
      groupIds: preferredNodeId ? [preferredNodeId] : [],
      priority: "NORMAL",
      assigneeIds: assigneeOptions.some((option) => option.id === currentUserId)
        ? [currentUserId]
        : [],
      dueDate: "",
      dueTime: "",
    };
  }

  const due = item.dueAt ? reminderDueToFormParts(item.dueAt) : null;
  return {
    title: item.title,
    description: item.description ?? "",
    groupIds: item.groups.map((group) => group.id),
    priority: item.priority,
    assigneeIds: item.assignees.map((assignee) => assignee.id),
    dueDate: due?.date ?? "",
    dueTime: item.dueAllDay ? "" : (due?.time ?? ""),
  };
}

function getFieldErrors(issues: readonly { path: PropertyKey[]; message: string }[]) {
  const fieldMap: Record<string, keyof FormValues> = {
    dueAt: "dueDate",
  };

  return Object.fromEntries(
    issues.map((issue) => {
      const schemaField = String(issue.path[0] ?? "title");
      return [fieldMap[schemaField] ?? schemaField, issue.message];
    }),
  );
}

export function ReminderFormModal({
  opened,
  sectorId,
  nodes,
  assigneeOptions,
  currentUserId,
  preferredNodeId,
  item,
  onClose,
  refreshAction,
}: ReminderFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeleteOpened, setConfirmDeleteOpened] = useState(false);
  const form = useForm<FormValues>({
    mode: "controlled",
    initialValues: getInitialValues(item, preferredNodeId, currentUserId, assigneeOptions),
  });

  async function handleSubmit(values: FormValues): Promise<void> {
    form.clearErrors();

    if (values.dueTime && !values.dueDate) {
      form.setFieldError("dueDate", "Inserisci la data della scadenza.");
      return;
    }

    const dueAt = values.dueDate ? reminderDueToIso(values.dueDate, values.dueTime) : null;
    if (values.dueDate && !dueAt) {
      form.setFieldError("dueDate", "La scadenza non è valida in Europe/Rome.");
      return;
    }

    const commonInput = {
      sectorId,
      groupIds: values.groupIds,
      title: values.title,
      description: values.description.trim() || null,
      dueAt,
      dueAllDay: !values.dueTime,
      priority: values.priority,
      assigneeIds: values.assigneeIds,
    };
    setIsSubmitting(true);
    let result;
    if (item) {
      const parsed = updateReminderSchema.safeParse({ id: item.id, ...commonInput });
      if (!parsed.success) {
        setIsSubmitting(false);
        form.setErrors(getFieldErrors(parsed.error.issues));
        return;
      }
      result = await updateReminder(parsed.data);
    } else {
      const parsed = createReminderSchema.safeParse(commonInput);
      if (!parsed.success) {
        setIsSubmitting(false);
        form.setErrors(getFieldErrors(parsed.error.issues));
        return;
      }
      result = await createReminder(parsed.data);
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
    refreshAction();
  }

  async function handleDelete(): Promise<void> {
    if (!item) {
      return;
    }

    setIsSubmitting(true);
    const result = await deleteReminder({ id: item.id, sectorId });
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
    refreshAction();
  }

  const isFormComplete = form.values.title.trim().length > 0;
  const activeGroupIds = new Set(nodes.map((node) => node.id));
  const groupOptions = [
    ...nodes.map((node) => ({
      value: node.id,
      label: node.name,
    })),
    ...(item?.groups ?? [])
      .filter((group) => group.isArchived && !activeGroupIds.has(group.id))
      .map((group) => ({
        value: group.id,
        label: `${group.name} (archiviato)`,
        disabled: true,
      })),
  ].toSorted((left, right) => left.label.localeCompare(right.label, "it"));

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        title={item ? "Modifica promemoria" : "Nuovo promemoria"}
        size="min(68rem, calc(100vw - 2rem))"
        closeOnClickOutside={!isSubmitting}
        closeOnEscape={!isSubmitting}
      >
        <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
          <Stack gap="md">
            <TextInput
              label="Titolo"
              placeholder="Titolo del promemoria"
              required
              maxLength={200}
              key={form.key("title")}
              {...form.getInputProps("title")}
            />
            <Textarea
              label="Descrizione"
              placeholder="Dettagli opzionali"
              autosize
              minRows={3}
              maxLength={2_000}
              key={form.key("description")}
              {...form.getInputProps("description")}
            />
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <MultiSelect
                label="Gruppi"
                description="Lascia vuoto per un promemoria personale."
                placeholder="Seleziona uno o più gruppi"
                clearable
                searchable
                data={groupOptions}
                key={form.key("groupIds")}
                {...form.getInputProps("groupIds")}
              />
              <MultiSelect
                label="Assegnatari"
                description="Puoi selezionare uno o più utenti."
                placeholder="Seleziona uno o più utenti"
                searchable
                clearable
                data={assigneeOptions.map((option) => ({
                  value: option.id,
                  label: option.displayName,
                }))}
                key={form.key("assigneeIds")}
                {...form.getInputProps("assigneeIds")}
              />
            </SimpleGrid>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              <Select
                label="Priorità"
                data={PRIORITY_OPTIONS}
                allowDeselect={false}
                key={form.key("priority")}
                {...form.getInputProps("priority")}
              />
              <TextInput
                type="date"
                label="Data di scadenza"
                description="Opzionale"
                key={form.key("dueDate")}
                {...form.getInputProps("dueDate")}
              />
              <TextInput
                type="time"
                label="Ora"
                description="Vuota = tutto il giorno"
                disabled={!form.values.dueDate}
                key={form.key("dueTime")}
                {...form.getInputProps("dueTime")}
              />
            </SimpleGrid>
            <Group justify={item ? "space-between" : "flex-end"} mt="sm">
              {item ? (
                <Button
                  type="button"
                  color="red"
                  variant="light"
                  onClick={() => setConfirmDeleteOpened(true)}
                  disabled={isSubmitting}
                >
                  Elimina
                </Button>
              ) : null}
              <Group>
                <Button type="button" variant="default" onClick={onClose} disabled={isSubmitting}>
                  Annulla
                </Button>
                <Button type="submit" loading={isSubmitting} disabled={!isFormComplete}>
                  {item ? "Salva modifiche" : "Crea promemoria"}
                </Button>
              </Group>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={confirmDeleteOpened}
        onClose={() => setConfirmDeleteOpened(false)}
        title="Conferma eliminazione"
        centered
        size="sm"
      >
        <Stack>
          <p>Eliminare definitivamente “{item?.title}”?</p>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setConfirmDeleteOpened(false)}>
              Annulla
            </Button>
            <Button color="red" loading={isSubmitting} onClick={handleDelete}>
              Elimina
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
