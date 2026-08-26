"use client";

import { Alert, Button, PasswordInput, Stack } from "@mantine/core";
import { IconAlertCircle, IconLock } from "@tabler/icons-react";
import { useActionState } from "react";

import { updatePasswordAction } from "./auth.actions";
import type { PasswordResetActionState } from "./auth.types";

const initialState: PasswordResetActionState = {};

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(updatePasswordAction, initialState);

  return (
    <form action={formAction} noValidate>
      <Stack gap="md">
        {state.formError ? (
          <Alert color="red" icon={<IconAlertCircle size={18} aria-hidden="true" />} role="alert">
            {state.formError}
          </Alert>
        ) : null}
        <PasswordInput
          name="password"
          label="Nuova password"
          description="Usa almeno 8 caratteri."
          autoComplete="new-password"
          leftSection={<IconLock size={17} aria-hidden="true" />}
          error={state.fieldErrors?.password}
          disabled={isPending}
          required
        />
        <PasswordInput
          name="confirmPassword"
          label="Conferma password"
          autoComplete="new-password"
          leftSection={<IconLock size={17} aria-hidden="true" />}
          error={state.fieldErrors?.confirmPassword}
          disabled={isPending}
          required
        />
        <Button type="submit" loading={isPending} fullWidth>
          Salva nuova password
        </Button>
      </Stack>
    </form>
  );
}
