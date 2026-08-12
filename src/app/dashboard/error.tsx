"use client";

import { Alert, Button, Container, Stack } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useEffect } from "react";

type DashboardErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error("Dashboard load failed.", error);
  }, [error]);

  const developmentMessage =
    process.env.NODE_ENV === "development" ? error.message : undefined;

  return (
    <main className="dashboard-page">
      <Container size="sm" py={80}>
        <Alert
          color="red"
          icon={<IconAlertCircle size={20} aria-hidden="true" />}
          title="Impossibile caricare la dashboard"
          role="alert"
        >
          <Stack gap="md">
            Si è verificato un errore durante il caricamento dei dati. Riprova tra poco.
            {developmentMessage ? <code>{developmentMessage}</code> : null}
            <Button variant="light" color="red" onClick={reset} w="fit-content">
              Riprova
            </Button>
          </Stack>
        </Alert>
      </Container>
    </main>
  );
}
