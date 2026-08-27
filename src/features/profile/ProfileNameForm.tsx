"use client";

import { Alert, Button, Paper, Stack, Text, TextInput } from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import { useActionState } from "react";

import { updateProfileNameAction } from "./profile.actions";
import type { ProfileNameActionState } from "./profile.types";

const initialState: ProfileNameActionState = {};

type ProfileNameFormProps = Readonly<{
  displayName: string;
  email: string | null;
}>;

export function ProfileNameForm({ displayName, email }: ProfileNameFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfileNameAction, initialState);

  return (
    <Paper withBorder p="lg">
      <form action={formAction} noValidate>
        <Stack gap="md">
          <div>
            <Text fw={700}>Dati profilo</Text>
            <Text c="dimmed" size="sm">
              Aggiorna il nome visualizzato nell&apos;applicazione.
            </Text>
          </div>

          {state.formError ? (
            <Alert color="red" icon={<IconAlertCircle size={18} aria-hidden="true" />} role="alert">
              {state.formError}
            </Alert>
          ) : null}
          {state.success ? (
            <Alert color="green" icon={<IconCheck size={18} aria-hidden="true" />} role="status">
              {state.success}
            </Alert>
          ) : null}

          <TextInput
            name="displayName"
            label="Nome"
            defaultValue={displayName}
            error={state.fieldErrors?.displayName}
            disabled={isPending}
            maxLength={120}
            required
          />
          <TextInput label="Email" type="email" defaultValue={email ?? ""} disabled />
          <Button type="submit" loading={isPending} ml="auto">
            Salva nome
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
