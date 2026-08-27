"use client";

import {
  Avatar,
  Badge,
  Box,
  Divider,
  Drawer,
  Group,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { IconLogout, IconUsers } from "@tabler/icons-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";

import { logoutAction } from "@/features/auth/auth.actions";
import type { AuthenticatedIdentity, Sector } from "@/features/auth/auth.types";

import { HelpGuide } from "./HelpGuide";
import { SectorSelector } from "./SectorSelector";

type MobileHeaderMenuProps = Readonly<{
  identity: AuthenticatedIdentity;
  sectors: readonly Sector[];
  activeSector?: Sector;
  calendarDate?: string;
  isAdmin: boolean;
  showUserManagementLink: boolean;
  notificationCenter: ReactNode;
}>;

export function MobileHeaderMenu({
  identity,
  sectors,
  activeSector,
  calendarDate,
  isAdmin,
  showUserManagementLink,
  notificationCenter,
}: MobileHeaderMenuProps) {
  const [opened, setOpened] = useState(false);

  function closeMenu(): void {
    setOpened(false);
  }

  return (
    <Box hiddenFrom="sm" className="dashboard-header-mobile-user">
      <UnstyledButton
        className="dashboard-mobile-avatar-button"
        onClick={() => setOpened(true)}
        aria-label={`Apri il menu di ${identity.displayName}`}
      >
        <Avatar color="clubBlue" radius="xl">
          {identity.initials}
        </Avatar>
      </UnstyledButton>

      <Drawer
        opened={opened}
        onClose={closeMenu}
        position="right"
        size="min(22rem, 100%)"
        title="Menu"
        overlayProps={{ backgroundOpacity: 0.35, blur: 2 }}
      >
        <Stack gap="lg">
          <Group wrap="nowrap">
            <Avatar color="clubBlue" radius="xl" size="lg">
              {identity.initials}
            </Avatar>
            <div className="dashboard-mobile-profile-copy">
              <Text fw={700} truncate="end">
                {identity.displayName}
              </Text>
              {identity.email ? (
                <Text c="dimmed" size="xs" truncate="end">
                  {identity.email}
                </Text>
              ) : null}
            </div>
          </Group>

          {sectors.length > 0 ? (
            <Stack gap="xs">
              <Text fw={650} size="sm">
                Settore
              </Text>
              {sectors.length > 1 ? (
                <SectorSelector
                  sectors={sectors}
                  activeSector={activeSector}
                  calendarDate={calendarDate}
                  onChangeComplete={closeMenu}
                />
              ) : (
                <Badge variant="light" color="blue" size="lg" className="dashboard-mobile-sector">
                  {activeSector?.name ?? sectors[0].name}
                </Badge>
              )}
            </Stack>
          ) : null}

          <Divider />

          <Stack gap={4}>
            {notificationCenter}
            <HelpGuide variant="menu" onOpen={closeMenu} />
            {isAdmin && showUserManagementLink ? (
              <Link
                href="/dashboard/admin/users"
                className="dashboard-mobile-menu-action"
                onClick={closeMenu}
              >
                <IconUsers size={19} aria-hidden="true" />
                <Text span fw={600} size="sm">
                  Gestione utenti
                </Text>
              </Link>
            ) : null}
            <form action={logoutAction}>
              <UnstyledButton
                type="submit"
                className="dashboard-mobile-menu-action"
                aria-label="Esci dall’applicazione"
              >
                <IconLogout size={19} aria-hidden="true" />
                <Text span fw={600} size="sm">
                  Esci
                </Text>
              </UnstyledButton>
            </form>
          </Stack>
        </Stack>
      </Drawer>
    </Box>
  );
}
