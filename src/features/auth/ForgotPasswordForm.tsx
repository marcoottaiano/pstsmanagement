"use client";

import { Alert, Anchor, Button, Stack, TextInput } from "@mantine/core";
import { IconAlertCircle, IconAt, IconCheck } from "@tabler/icons-react";
import { useActionState } from "react";

import { requestPasswordResetAction } from "./auth.actions";
import type { PasswordResetActionState } from "./auth.types";

const initialState: PasswordResetActionState = {};

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordResetAction, initialState);

  return (
    <form action={formAction} noValidate>
      <Stack gap="md">
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
          name="email"
          type="email"
          label="Email"
          placeholder="nome@esempio.it"
          autoComplete="email"
          leftSection={<IconAt size={17} aria-hidden="true" />}
          error={state.fieldErrors?.email}
          disabled={isPending}
          required
        />
        <Button type="submit" loading={isPending} fullWidth>
          Invia istruzioni
        </Button>
        <Anchor href="/login" size="sm" ta="center">
          Torna alla login
        </Anchor>
      </Stack>
    </form>
  );
}
