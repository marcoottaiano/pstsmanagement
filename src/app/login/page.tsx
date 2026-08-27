import { Box, Container, Image, Paper, Stack, Text, Title } from "@mantine/core";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { APP_CONFIG } from "@/config/app.config";
import { getAuthenticatedContext } from "@/features/auth/auth.data";
import { LoginForm } from "@/features/auth/LoginForm";

export const metadata: Metadata = {
  title: `Accesso | ${APP_CONFIG.name}`,
};

type LoginPageProps = Readonly<{
  searchParams: Promise<Readonly<{ error?: string; reset?: string }>>;
}>;

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const context = await getAuthenticatedContext();

  if (context) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  return (
    <Box component="main" className="auth-page">
      <Container size={440} w="100%">
        <Stack gap="xl">
          <Stack align="center" gap="sm" ta="center">
            <Image src="/psts-logo.png" alt="Logo PSTS" h={72} w={72} fit="contain" />
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
              <LoginForm
                resetCompleted={params.reset === "success"}
                linkError={
                  params.error === "invite" || params.error === "recovery"
                    ? params.error
                    : undefined
                }
              />
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
