import { Avatar, Button, Group, Stack, Text, Title } from "@mantine/core";
import { IconLogout, IconUsers } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import { APP_CONFIG } from "@/config/app.config";
import { logoutAction } from "@/features/auth/auth.actions";
import type { AuthenticatedIdentity, Sector } from "@/features/auth/auth.types";
import { NotificationCenter } from "@/features/notifications/NotificationCenter";

import { HelpGuide } from "./HelpGuide";
import { SectorSelector } from "./SectorSelector";

type DashboardHeaderProps = Readonly<{
  identity: AuthenticatedIdentity;
  sectors?: readonly Sector[];
  activeSector?: Sector;
  calendarDate?: string;
  isAdmin?: boolean;
  showUserManagementLink?: boolean;
}>;

export function DashboardHeader({
  identity,
  sectors = [],
  activeSector,
  calendarDate,
  isAdmin = false,
  showUserManagementLink = true,
}: DashboardHeaderProps) {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header-layout">
        <Group className="dashboard-header-brand" gap="sm" wrap="nowrap">
          <Image
            src="/psts-logo.png"
            alt="Logo PSTS"
            width={48}
            height={48}
            className="dashboard-logo"
            priority
          />
          <Title className="dashboard-header-title" order={1} size="h3" visibleFrom="xs">
            {APP_CONFIG.name}
          </Title>
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

        <Group className="dashboard-header-user" gap="sm" wrap="nowrap">
          <HelpGuide />
          <NotificationCenter />
          {isAdmin && showUserManagementLink ? (
            <Link href="/dashboard/admin/users" aria-label="Gestione utenti">
              <Button
                component="span"
                variant="subtle"
                color="gray"
                leftSection={<IconUsers size={17} aria-hidden="true" />}
              >
                <Text span visibleFrom="md">
                  Utenti
                </Text>
              </Button>
            </Link>
          ) : null}
          <Avatar color="clubBlue" radius="xl" aria-label={`Profilo di ${identity.displayName}`}>
            {identity.initials}
          </Avatar>
          <Stack gap={0} visibleFrom="sm" maw={220}>
            <Text fw={600} size="sm" truncate="end">
              {identity.displayName}
            </Text>
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
