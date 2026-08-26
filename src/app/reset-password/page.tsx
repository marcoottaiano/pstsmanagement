import { Box, Container, Image, Paper, Stack, Text, Title } from "@mantine/core";
import type { Metadata } from "next";

import { APP_CONFIG } from "@/config/app.config";
import { ResetPasswordForm } from "@/features/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: `Imposta nuova password | ${APP_CONFIG.name}`,
};

export default function ResetPasswordPage() {
  return (
    <Box component="main" className="auth-page">
      <Container size={440} w="100%">
        <Stack gap="xl">
          <Stack align="center" gap="sm" ta="center">
            <Image src="/psts-logo.png" alt="Logo PSTS" h={72} w={72} fit="contain" />
            <Title order={1} size="h2">
              Imposta nuova password
            </Title>
            <Text c="dimmed">Scegli una nuova password per il tuo account.</Text>
          </Stack>
          <Paper withBorder shadow="sm" p={{ base: "lg", sm: "xl" }}>
            <ResetPasswordForm />
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
