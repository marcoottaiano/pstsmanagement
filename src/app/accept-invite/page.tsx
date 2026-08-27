import { Box, Container, Image, Paper, Stack, Text, Title } from "@mantine/core";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { APP_CONFIG } from "@/config/app.config";
import { ResetPasswordForm } from "@/features/auth/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: `Accetta invito | ${APP_CONFIG.name}`,
};

export default async function AcceptInvitePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims.sub) {
    redirect("/login?error=invite");
  }

  return (
    <Box component="main" className="auth-page">
      <Container size={440} w="100%">
        <Stack gap="xl">
          <Stack align="center" gap="sm" ta="center">
            <Image src="/psts-logo.png" alt="Logo PSTS" h={72} w={72} fit="contain" />
            <Title order={1} size="h2">
              Completa il tuo account
            </Title>
            <Text c="dimmed">Scegli la password che userai per accedere a {APP_CONFIG.name}.</Text>
          </Stack>
          <Paper withBorder shadow="sm" p={{ base: "lg", sm: "xl" }}>
            <ResetPasswordForm submitLabel="Imposta password e accedi" />
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
