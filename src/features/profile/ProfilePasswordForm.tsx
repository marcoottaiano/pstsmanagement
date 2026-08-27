"use client";

import { Alert, Button, PasswordInput, Paper, Stack, Text } from "@mantine/core";
import { IconAlertCircle, IconCheck, IconLock } from "@tabler/icons-react";
import { useActionState } from "react";

import { updateProfilePasswordAction } from "./profile.actions";
import type { ProfilePasswordActionState } from "./profile.types";

const initialState: ProfilePasswordActionState = {};

export function ProfilePasswordForm() {
  const [state, formAction, isPending] = useActionState(updateProfilePasswordAction, initialState);

  return (
    <Paper withBorder p="lg">
      <form action={formAction} noValidate>
        <Stack gap="md">
          <div>
            <Text fw={700}>Password</Text>
            <Text c="dimmed" size="sm">
              Inserisci la nuova password due volte per confermare la modifica.
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

          <PasswordInput
            name="password"
            label="Nuova password"
            autoComplete="new-password"
            leftSection={<IconLock size={17} aria-hidden="true" />}
            error={state.fieldErrors?.password}
            disabled={isPending}
            required
          />
          <PasswordInput
            name="confirmPassword"
            label="Ripeti nuova password"
            autoComplete="new-password"
            leftSection={<IconLock size={17} aria-hidden="true" />}
            error={state.fieldErrors?.confirmPassword}
            disabled={isPending}
            required
          />
          <Button type="submit" loading={isPending} ml="auto">
            Aggiorna password
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
