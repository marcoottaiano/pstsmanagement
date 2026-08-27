"use client";

import { Avatar, Badge, Menu, Stack, Text, UnstyledButton } from "@mantine/core";
import {
  IconChartBar,
  IconChevronDown,
  IconHistory,
  IconLogout,
  IconUserCircle,
  IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";

import { getAvatarDataUri } from "@/features/avatar/avatar";
import { logoutAction } from "@/features/auth/auth.actions";
import type { AuthenticatedIdentity, Sector } from "@/features/auth/auth.types";

import { SectorSelector } from "./SectorSelector";

type UserMenuProps = Readonly<{
  identity: AuthenticatedIdentity;
  sectors: readonly Sector[];
  activeSector?: Sector;
  calendarDate?: string;
  isAdmin: boolean;
  showActivityLogLink: boolean;
  showUserManagementLink: boolean;
}>;

export function UserMenu({
  identity,
  sectors,
  activeSector,
  calendarDate,
  isAdmin,
  showActivityLogLink,
  showUserManagementLink,
}: UserMenuProps) {
  const [opened, setOpened] = useState(false);
  const avatarSrc = getAvatarDataUri(identity.avatar);
  const sectorQuery = activeSector ? `?sector=${activeSector.code}` : "";

  function closeMenu(): void {
    setOpened(false);
  }

  return (
    <>
      <Menu
        opened={opened}
        onChange={setOpened}
        position="bottom-end"
        width={220}
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
            <Avatar src={avatarSrc} color="clubBlue" radius="xl">
              {identity.initials}
            </Avatar>
            <Text fw={600} size="sm" truncate="end" visibleFrom="sm">
              {identity.displayName}
            </Text>
            <IconChevronDown className="dashboard-user-menu-chevron" size={16} aria-hidden="true" />
          </UnstyledButton>
        </Menu.Target>

        <Menu.Dropdown>
          {sectors.length > 0 ? (
            <>
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

          <Menu.Item
            component={Link}
            href="/dashboard/profile"
            leftSection={<IconUserCircle size={17} />}
          >
            Profilo
          </Menu.Item>
          {isAdmin ? (
            <Menu.Item
              component={Link}
              href={`/dashboard/admin/statistics${sectorQuery}`}
              leftSection={<IconChartBar size={17} />}
            >
              Statistiche
            </Menu.Item>
          ) : null}
          {isAdmin && showActivityLogLink ? (
            <Menu.Item
              component={Link}
              href={`/dashboard/admin/activity${sectorQuery}`}
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
    </>
  );
}
