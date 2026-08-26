import { Avatar, Button, Group, Stack, Text, Title } from "@mantine/core";
import { IconLogout } from "@tabler/icons-react";
import Image from "next/image";

import { APP_CONFIG } from "@/config/app.config";
import { logoutAction } from "@/features/auth/auth.actions";
import type { AuthenticatedIdentity, Sector } from "@/features/auth/auth.types";

import { SectorSelector } from "./SectorSelector";

type DashboardHeaderProps = Readonly<{
  identity: AuthenticatedIdentity;
  sectors?: readonly Sector[];
  activeSector?: Sector;
  calendarDate?: string;
}>;

export function DashboardHeader({
  identity,
  sectors = [],
  activeSector,
  calendarDate,
}: DashboardHeaderProps) {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header-layout">
        <Group gap="sm" wrap="nowrap">
          <Image
            src="/psts-logo.png"
            alt="Logo PSTS"
            width={48}
            height={48}
            className="dashboard-logo"
            priority
          />
          <Title order={1} size="h3" visibleFrom="xs">
            {APP_CONFIG.name}
          </Title>
          <Text fw={650} hiddenFrom="xs">
            PSTS
          </Text>
        </Group>

        {sectors.length > 1 ? (
          <div className="dashboard-header-sector">
            <SectorSelector
              sectors={sectors}
              activeSector={activeSector}
              calendarDate={calendarDate}
            />
          </div>
        ) : null}

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
      </div>
    </header>
  );
}
