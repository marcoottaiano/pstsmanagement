"use client";

import {
  Button,
  Checkbox,
  Group,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useState } from "react";

import type { GroupNode } from "@/features/groups/groups.types";

import {
  createScheduledWork,
  deleteScheduledWork,
  updateScheduledWork,
} from "./scheduled-work.actions";
import {
  inclusiveAllDayEndToIso,
  romeDateTimeToIso,
  storedDateTimeToFormParts,
  storedExclusiveEndToInclusiveDate,
} from "./scheduled-work.dates";
import { createScheduledWorkSchema, updateScheduledWorkSchema } from "./scheduled-work.schemas";
import type { ScheduledWorkCalendarItem } from "./scheduled-work.types";

export type ScheduledWorkPreset = Readonly<{
  allDay: boolean;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}>;

type ScheduledWorkFormModalProps = Readonly<{
  opened: boolean;
  sectorId: string;
  groups: readonly GroupNode[];
  preferredGroupId: string | null;
  item: ScheduledWorkCalendarItem | null;
  preset: ScheduledWorkPreset;
  onClose: () => void;
  refreshAction: () => void;
}>;

type FormValues = {
  title: string;
  description: string;
  groupId: string;
  allDay: boolean;
  startDate: string;
  startTime: string;
  hasEnd: boolean;
  endDate: string;
  endTime: string;
};

function getInitialValues(
  item: ScheduledWorkCalendarItem | null,
  preset: ScheduledWorkPreset,
  preferredGroupId: string | null,
): FormValues {
  if (!item) {
    return {
      title: "",
      description: "",
      groupId: preferredGroupId ?? "",
      allDay: preset.allDay,
      startDate: preset.startDate,
      startTime: preset.startTime,
      hasEnd: true,
      endDate: preset.endDate,
      endTime: preset.endTime,
    };
  }

  const start = storedDateTimeToFormParts(item.startAt);
  const end = item.endAt ? storedDateTimeToFormParts(item.endAt) : null;

  return {
    title: item.title,
    description: item.description ?? "",
    groupId: item.groupId,
    allDay: item.allDay,
    startDate: start.date,
    startTime: start.time,
    hasEnd: item.endAt !== null,
    endDate:
      item.allDay && item.endAt
        ? storedExclusiveEndToInclusiveDate(item.endAt)
        : (end?.date ?? start.date),
    endTime: end?.time ?? start.time,
  };
}

function getFieldErrors(issues: readonly { path: PropertyKey[]; message: string }[]) {
  const fieldMap: Record<string, keyof FormValues> = {
    startAt: "startDate",
    endAt: "endDate",
  };

  return Object.fromEntries(
    issues.map((issue) => {
      const schemaField = String(issue.path[0] ?? "title");
      return [fieldMap[schemaField] ?? schemaField, issue.message];
    }),
  );
}

export function ScheduledWorkFormModal({
  opened,
  sectorId,
  groups,
  preferredGroupId,
  item,
  preset,
  onClose,
  refreshAction,
}: ScheduledWorkFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeleteOpened, setConfirmDeleteOpened] = useState(false);
  const form = useForm<FormValues>({
    mode: "controlled",
    initialValues: getInitialValues(item, preset, preferredGroupId),
  });

  async function handleSubmit(values: FormValues): Promise<void> {
    form.clearErrors();

    if (!values.groupId) {
      form.setFieldError("groupId", "Seleziona un gruppo.");
      return;
    }
    if (!values.startDate || (!values.allDay && !values.startTime)) {
      form.setFieldError("startDate", "Inserisci una data di inizio valida.");
      return;
    }
    if (values.hasEnd && (!values.endDate || (!values.allDay && !values.endTime))) {
      form.setFieldError("endDate", "Inserisci una data di fine valida.");
      return;
    }

    const startAt = romeDateTimeToIso(values.startDate, values.allDay ? "00:00" : values.startTime);
    const endAt = values.hasEnd
      ? values.allDay
        ? inclusiveAllDayEndToIso(values.endDate)
        : romeDateTimeToIso(values.endDate, values.endTime)
      : null;

    if (!startAt || (values.hasEnd && !endAt)) {
      form.setFieldError("startDate", "La data o l’orario indicato non è valido in Europe/Rome.");
      return;
    }

    const commonInput = {
      sectorId,
      groupId: values.groupId,
      title: values.title,
      description: values.description.trim() || null,
      startAt,
      endAt,
      allDay: values.allDay,
    };
    const parsed = item
      ? updateScheduledWorkSchema.safeParse({ id: item.id, ...commonInput })
      : createScheduledWorkSchema.safeParse(commonInput);

    if (!parsed.success) {
      form.setErrors(getFieldErrors(parsed.error.issues));
      return;
    }

    setIsSubmitting(true);
    const result = item
      ? await updateScheduledWork({ id: item.id, ...commonInput })
      : await createScheduledWork(commonInput);
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
    const result = await deleteScheduledWork({ id: item.id, sectorId });
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

  const allDay = form.values.allDay;
  const hasEnd = form.values.hasEnd;
  const isFormComplete =
    form.values.title.trim().length > 0 &&
    form.values.groupId.length > 0 &&
    form.values.startDate.length > 0 &&
    (allDay || form.values.startTime.length > 0) &&
    (!hasEnd || (form.values.endDate.length > 0 && (allDay || form.values.endTime.length > 0)));

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        title={item ? "Modifica lavoro programmato" : "Nuovo lavoro programmato"}
        size="min(68rem, calc(100vw - 2rem))"
        closeOnClickOutside={!isSubmitting}
        closeOnEscape={!isSubmitting}
      >
        <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
          <Stack gap="md">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <TextInput
                label="Titolo"
                placeholder="Titolo del lavoro"
                required
                maxLength={200}
                key={form.key("title")}
                {...form.getInputProps("title")}
              />
              <Select
                label="Gruppo"
                placeholder="Seleziona un gruppo"
                required
                searchable
                data={groups.map((group) => ({ value: group.id, label: group.name }))}
                key={form.key("groupId")}
                {...form.getInputProps("groupId")}
              />
            </SimpleGrid>
            <Textarea
              label="Descrizione"
              placeholder="Dettagli opzionali"
              autosize
              minRows={3}
              maxLength={2_000}
              key={form.key("description")}
              {...form.getInputProps("description")}
            />
            <Switch
              label="Tutto il giorno"
              key={form.key("allDay")}
              {...form.getInputProps("allDay", { type: "checkbox" })}
            />
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <TextInput
                type="date"
                label="Data di inizio"
                required
                key={form.key("startDate")}
                {...form.getInputProps("startDate")}
              />
              {!allDay ? (
                <TextInput
                  type="time"
                  label="Ora di inizio"
                  required
                  key={form.key("startTime")}
                  {...form.getInputProps("startTime")}
                />
              ) : null}
            </SimpleGrid>
            <Checkbox
              label="Imposta una fine"
              key={form.key("hasEnd")}
              {...form.getInputProps("hasEnd", { type: "checkbox" })}
            />
            {hasEnd ? (
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <TextInput
                  type="date"
                  label={allDay ? "Data di fine inclusiva" : "Data di fine"}
                  description={allDay ? "Il giorno indicato è compreso nel lavoro." : undefined}
                  required
                  key={form.key("endDate")}
                  {...form.getInputProps("endDate")}
                />
                {!allDay ? (
                  <TextInput
                    type="time"
                    label="Ora di fine"
                    required
                    key={form.key("endTime")}
                    {...form.getInputProps("endTime")}
                  />
                ) : null}
              </SimpleGrid>
            ) : null}
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
                  {item ? "Salva modifiche" : "Crea lavoro"}
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
