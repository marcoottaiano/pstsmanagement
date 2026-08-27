"use client";

import { Avatar, Badge, Divider, Menu, Stack, Text, UnstyledButton } from "@mantine/core";
import {
  IconChartBar,
  IconChevronDown,
  IconFileDescription,
  IconHelp,
  IconHistory,
  IconLogout,
  IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";

import { logoutAction } from "@/features/auth/auth.actions";
import type { AuthenticatedIdentity, Sector } from "@/features/auth/auth.types";

import { HelpGuide } from "./HelpGuide";
import { SectorSelector } from "./SectorSelector";

type UserMenuProps = Readonly<{
  identity: AuthenticatedIdentity;
  sectors: readonly Sector[];
  activeSector?: Sector;
  calendarDate?: string;
  isAdmin: boolean;
  showActivityLogLink: boolean;
  showUserManagementLink: boolean;
  notificationCenter: ReactNode;
}>;

export function UserMenu({
  identity,
  sectors,
  activeSector,
  calendarDate,
  isAdmin,
  showActivityLogLink,
  showUserManagementLink,
  notificationCenter,
}: UserMenuProps) {
  const [opened, setOpened] = useState(false);
  const [guideOpened, setGuideOpened] = useState(false);

  function closeMenu(): void {
    setOpened(false);
  }

  return (
    <>
      <Menu
        opened={opened}
        onChange={setOpened}
        position="bottom-end"
        width={280}
        shadow="md"
        withinPortal
      >
        <Menu.Target>
          <UnstyledButton
            className="dashboard-user-menu-trigger"
            aria-label={`Apri il menu di ${identity.displayName}`}
            aria-expanded={opened}
            aria-haspopup="menu"
            data-expanded={opened || undefined}
          >
            <Avatar color="clubBlue" radius="xl">
              {identity.initials}
            </Avatar>
            <Text fw={600} size="sm" truncate="end" visibleFrom="sm">
              {identity.displayName}
            </Text>
            <IconChevronDown className="dashboard-user-menu-chevron" size={16} aria-hidden="true" />
          </UnstyledButton>
        </Menu.Target>

        <Menu.Dropdown>
          <Stack gap={2} px="sm" py="xs">
            <Text fw={700} size="sm" truncate="end">
              {identity.displayName}
            </Text>
            {identity.email ? (
              <Text c="dimmed" size="xs" truncate="end">
                {identity.email}
              </Text>
            ) : null}
          </Stack>

          {sectors.length > 0 ? (
            <>
              <Divider my="xs" hiddenFrom="sm" />
              <Stack gap="xs" px="sm" py="xs" hiddenFrom="sm">
                <Text fw={650} size="xs">
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
            </>
          ) : null}

          <Menu.Divider />
          {notificationCenter}
          <Menu.Item
            leftSection={<IconHelp size={17} />}
            onClick={() => {
              closeMenu();
              setGuideOpened(true);
            }}
          >
            Guida rapida
          </Menu.Item>
          {isAdmin ? (
            <Menu.Item
              component={Link}
              href="/dashboard/admin/statistics"
              leftSection={<IconChartBar size={17} />}
            >
              Statistiche
            </Menu.Item>
          ) : null}
          {isAdmin ? (
            <Menu.Item
              component={Link}
              href="/dashboard/admin/reports"
              leftSection={<IconFileDescription size={17} />}
            >
              Report mensili
            </Menu.Item>
          ) : null}
          {isAdmin && showActivityLogLink ? (
            <Menu.Item
              component={Link}
              href="/dashboard/admin/activity"
              leftSection={<IconHistory size={17} />}
            >
              Registro attività
            </Menu.Item>
          ) : null}
          {isAdmin && showUserManagementLink ? (
            <Menu.Item
              component={Link}
              href="/dashboard/admin/users"
              leftSection={<IconUsers size={17} />}
            >
              Gestione utenti
            </Menu.Item>
          ) : null}
          <Menu.Divider />
          <form action={logoutAction}>
            <Menu.Item type="submit" color="red" leftSection={<IconLogout size={17} />}>
              Esci
            </Menu.Item>
          </form>
        </Menu.Dropdown>
      </Menu>
      <HelpGuide isAdmin={isAdmin} opened={guideOpened} onClose={() => setGuideOpened(false)} />
    </>
  );
}
