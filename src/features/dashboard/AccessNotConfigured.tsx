import { Alert, Button, Paper, Stack, Text, Title } from "@mantine/core";
import { IconAlertTriangle, IconLogout } from "@tabler/icons-react";

import { logoutAction } from "@/features/auth/auth.actions";

type AccessNotConfiguredProps = Readonly<{
  profileConfigured: boolean;
}>;

export function AccessNotConfigured({ profileConfigured }: AccessNotConfiguredProps) {
  return (
    <Paper withBorder shadow="xs" p={{ base: "lg", sm: "xl" }} maw={620} mx="auto">
      <Stack gap="lg">
        <Alert
          color="orange"
          icon={<IconAlertTriangle size={20} aria-hidden="true" />}
          title="Accesso non configurato"
          role="alert"
        >
          {profileConfigured
            ? "Il tuo account non è ancora associato a un settore. Contatta l’amministratore della piattaforma."
            : "Il profilo applicativo non è disponibile. Contatta l’amministratore della piattaforma."}
        </Alert>
        <div>
          <Title order={2} size="h3">
            La dashboard non è disponibile
          </Title>
          <Text c="dimmed" mt="xs">
            Per sicurezza non verrà mostrato alcun contenuto operativo finché la configurazione non
            sarà completata.
          </Text>
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="light" leftSection={<IconLogout size={17} />}>
            Esci
          </Button>
        </form>
      </Stack>
    </Paper>
  );
}
