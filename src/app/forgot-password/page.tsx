import { Box, Container, Image, Paper, Stack, Text, Title } from "@mantine/core";
import type { Metadata } from "next";

import { APP_CONFIG } from "@/config/app.config";
import { ForgotPasswordForm } from "@/features/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: `Recupera password | ${APP_CONFIG.name}`,
};

export default function ForgotPasswordPage() {
  return (
    <Box component="main" className="auth-page">
      <Container size={440} w="100%">
        <Stack gap="xl">
          <Stack align="center" gap="sm" ta="center">
            <Image src="/psts-logo.png" alt="Logo PSTS" h={72} w={72} fit="contain" />
            <Title order={1} size="h2">
              Recupera password
            </Title>
            <Text c="dimmed">Inserisci la tua email per ricevere le istruzioni.</Text>
          </Stack>
          <Paper withBorder shadow="sm" p={{ base: "lg", sm: "xl" }}>
            <ForgotPasswordForm />
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
