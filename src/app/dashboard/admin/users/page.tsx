import { Button, Container, Group, Stack, Text, Title } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { APP_CONFIG } from "@/config/app.config";
import { getAdminUsersPageData } from "@/features/admin/admin.data";
import { AdminUsersPanel } from "@/features/admin/AdminUsersPanel";
import { getAuthenticatedContext } from "@/features/auth/auth.data";
import { DashboardHeader } from "@/features/dashboard/DashboardHeader";

export const metadata: Metadata = {
  title: `Gestione utenti | ${APP_CONFIG.name}`,
};

export default async function AdminUsersPage() {
  const context = await getAuthenticatedContext();
  if (!context) {
    redirect("/login");
  }
  if (!context.isAdmin) {
    redirect("/dashboard");
  }

  const { users, sectors } = await getAdminUsersPageData();

  return (
    <main className="dashboard-page">
      <DashboardHeader identity={context.identity} isAdmin showUserManagementLink={false} />
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
            <Group justify="space-between" align="flex-end" mt="sm">
              <div>
                <Title order={1}>Gestione utenti</Title>
                <Text c="dimmed" mt={4}>
                  Invita nuovi collaboratori e configura i settori ai quali possono accedere.
                </Text>
              </div>
              <Text c="dimmed" size="sm">
                {users.length} {users.length === 1 ? "utente" : "utenti"}
              </Text>
            </Group>
          </div>
          <AdminUsersPanel users={users} sectors={sectors} />
        </Stack>
      </Container>
    </main>
  );
}
