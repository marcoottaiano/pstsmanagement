import { Avatar, Button, Group, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconCalendarStats, IconLogout } from "@tabler/icons-react";

import { APP_CONFIG } from "@/config/app.config";
import { logoutAction } from "@/features/auth/auth.actions";
import type { AuthenticatedIdentity } from "@/features/auth/auth.types";

type DashboardHeaderProps = Readonly<{
  identity: AuthenticatedIdentity;
}>;

export function DashboardHeader({ identity }: DashboardHeaderProps) {
  return (
    <header className="dashboard-header">
      <Group justify="space-between" wrap="nowrap" gap="md">
        <Group gap="sm" wrap="nowrap">
          <ThemeIcon size={42} radius="md" variant="light" aria-hidden="true">
            <IconCalendarStats size={24} />
          </ThemeIcon>
          <Title order={1} size="h3" visibleFrom="xs">
            {APP_CONFIG.name}
          </Title>
          <Text fw={650} hiddenFrom="xs">
            PSTS
          </Text>
        </Group>

        <Group gap="sm" wrap="nowrap">
          <Avatar color="clubBlue" radius="xl" aria-label={`Profilo di ${identity.displayName}`}>
            {identity.initials}
          </Avatar>
          <Stack gap={0} visibleFrom="sm" maw={220}>
            <Text fw={600} size="sm" truncate="end">
              {identity.displayName}
            </Text>
            {identity.email ? (
              <Text c="dimmed" size="xs" truncate="end">
                {identity.email}
              </Text>
            ) : null}
          </Stack>
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="subtle"
              color="gray"
              leftSection={<IconLogout size={17} aria-hidden="true" />}
              aria-label="Esci dall’applicazione"
            >
              <Text span visibleFrom="sm">
                Esci
              </Text>
            </Button>
          </form>
        </Group>
      </Group>
    </header>
  );
}
