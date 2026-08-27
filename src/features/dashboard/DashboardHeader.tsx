import { Box, Group, Title } from "@mantine/core";
import Image from "next/image";

import { APP_CONFIG } from "@/config/app.config";
import type { AuthenticatedIdentity, Sector } from "@/features/auth/auth.types";
import { NotificationCenter } from "@/features/notifications/NotificationCenter";

import { SectorSelector } from "./SectorSelector";
import { UserMenu } from "./UserMenu";

type DashboardHeaderProps = Readonly<{
  identity: AuthenticatedIdentity;
  sectors?: readonly Sector[];
  activeSector?: Sector;
  calendarDate?: string;
  isAdmin?: boolean;
  showActivityLogLink?: boolean;
  showUserManagementLink?: boolean;
}>;

export function DashboardHeader({
  identity,
  sectors = [],
  activeSector,
  calendarDate,
  isAdmin = false,
  showActivityLogLink = true,
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
          <Title className="dashboard-header-title" order={1} size="h3" visibleFrom="sm">
            {APP_CONFIG.name}
          </Title>
        </Group>

        {sectors.length > 1 ? (
          <Box className="dashboard-header-sector" visibleFrom="sm">
            <SectorSelector
              sectors={sectors}
              activeSector={activeSector}
              calendarDate={calendarDate}
            />
          </Box>
        ) : null}

        <UserMenu
          identity={identity}
          sectors={sectors}
          activeSector={activeSector}
          calendarDate={calendarDate}
          isAdmin={isAdmin}
          showActivityLogLink={showActivityLogLink}
          showUserManagementLink={showUserManagementLink}
          notificationCenter={<NotificationCenter variant="menu" />}
        />
      </div>
    </header>
  );
}
