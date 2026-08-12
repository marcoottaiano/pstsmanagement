import { Box, Container, Paper, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconCalendarStats } from "@tabler/icons-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { APP_CONFIG } from "@/config/app.config";
import { getAuthenticatedContext } from "@/features/auth/auth.data";
import { LoginForm } from "@/features/auth/LoginForm";

export const metadata: Metadata = {
  title: `Accesso | ${APP_CONFIG.name}`,
};

export default async function LoginPage() {
  const context = await getAuthenticatedContext();

  if (context) {
    redirect("/dashboard");
  }

  return (
    <Box component="main" className="auth-page">
      <Container size={440} w="100%">
        <Stack gap="xl">
          <Stack align="center" gap="sm" ta="center">
            <ThemeIcon size={54} radius="xl" variant="light" aria-hidden="true">
              <IconCalendarStats size={30} stroke={1.7} />
            </ThemeIcon>
            <Stack gap={4}>
              <Title order={1} size="h2">
                {APP_CONFIG.name}
              </Title>
              <Text c="dimmed">Accedi con le credenziali fornite dalla società.</Text>
            </Stack>
          </Stack>

          <Paper withBorder shadow="sm" p={{ base: "lg", sm: "xl" }}>
            <Stack gap="lg">
              <div>
                <Title order={2} size="h3">
                  Bentornato
                </Title>
                <Text c="dimmed" size="sm" mt={4}>
                  Inserisci email e password per continuare.
                </Text>
              </div>
              <LoginForm />
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
