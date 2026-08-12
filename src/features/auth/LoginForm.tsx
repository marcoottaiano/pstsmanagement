"use client";

import { Alert, Button, PasswordInput, Stack, TextInput } from "@mantine/core";
import { IconAlertCircle, IconAt, IconLock } from "@tabler/icons-react";
import { useActionState } from "react";

import { loginAction } from "./auth.actions";
import type { LoginActionState } from "./auth.types";

const initialLoginState: LoginActionState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialLoginState);

  return (
    <form action={formAction} noValidate>
      <Stack gap="md">
        {state.formError ? (
          <Alert
            color="red"
            icon={<IconAlertCircle size={18} aria-hidden="true" />}
            role="alert"
            title="Accesso non riuscito"
          >
            {state.formError}
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
        <PasswordInput
          name="password"
          label="Password"
          autoComplete="current-password"
          leftSection={<IconLock size={17} aria-hidden="true" />}
          error={state.fieldErrors?.password}
          disabled={isPending}
          required
        />
        <Button type="submit" loading={isPending} fullWidth mt="xs">
          Accedi
        </Button>
      </Stack>
    </form>
  );
}
