import { Button, Container, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconArrowLeft, IconUserCircle } from "@tabler/icons-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { APP_CONFIG } from "@/config/app.config";
import { DEFAULT_USER_AVATAR_BACKGROUND, getDefaultAvatarSeed } from "@/features/avatar/avatar";
import { getAuthenticatedContext } from "@/features/auth/auth.data";
import { DashboardHeader } from "@/features/dashboard/DashboardHeader";
import { ProfileAvatarForm } from "@/features/profile/ProfileAvatarForm";
import { ProfileNameForm } from "@/features/profile/ProfileNameForm";
import { ProfilePasswordForm } from "@/features/profile/ProfilePasswordForm";

export const metadata: Metadata = {
  title: `Profilo | ${APP_CONFIG.name}`,
};

export default async function ProfilePage() {
  const context = await getAuthenticatedContext();
  if (!context) {
    redirect("/login");
  }

  return (
    <main className="dashboard-page">
      <DashboardHeader identity={context.identity} isAdmin={context.isAdmin} />
      <Container className="dashboard-content" py="xl">
        <Stack gap="xl">
          <div>
            <Link href="/dashboard">
              <Button
                component="span"
                variant="subtle"
                color="gray"
                px={0}
                leftSection={<IconArrowLeft size={17} aria-hidden="true" />}
              >
                Torna alla dashboard
              </Button>
            </Link>
            <Group align="center" wrap="nowrap" mt="sm">
              <ThemeIcon color="clubBlue" variant="light" radius="md" size="xl">
                <IconUserCircle size={24} aria-hidden="true" />
              </ThemeIcon>
              <div>
                <Title order={1}>Profilo</Title>
                <Text c="dimmed" mt={4}>
                  Personalizza come compari nella dashboard e negli assegnatari.
                </Text>
              </div>
            </Group>
          </div>
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" verticalSpacing="lg">
            <ProfileNameForm
              displayName={context.identity.displayName}
              email={context.identity.email}
            />
            <ProfileAvatarForm
              avatar={{
                style: context.identity.avatar.style,
                seed:
                  context.identity.avatar.seed ||
                  getDefaultAvatarSeed(context.identity.displayName, context.identity.email),
                background: context.identity.avatar.background || DEFAULT_USER_AVATAR_BACKGROUND,
              }}
            />
            <ProfilePasswordForm />
          </SimpleGrid>
        </Stack>
      </Container>
    </main>
  );
}
