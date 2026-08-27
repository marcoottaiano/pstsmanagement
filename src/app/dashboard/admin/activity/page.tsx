import { Button, Container, Group, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconArrowLeft, IconHistory } from "@tabler/icons-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { APP_CONFIG } from "@/config/app.config";
import { getAuthenticatedContext } from "@/features/auth/auth.data";
import { ActivityFilters } from "@/features/activity/ActivityFilters";
import { getActivityLogPageData, parseActivityLogFilters } from "@/features/activity/activity.data";
import { ActivityLogList } from "@/features/activity/ActivityLogList";
import { ActivityPagination } from "@/features/activity/ActivityPagination";
import { DashboardHeader } from "@/features/dashboard/DashboardHeader";

export const metadata: Metadata = {
  title: `Registro attività | ${APP_CONFIG.name}`,
};

type AdminActivityPageProps = Readonly<{
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>;

export default async function AdminActivityPage({ searchParams }: AdminActivityPageProps) {
  const [context, query] = await Promise.all([getAuthenticatedContext(), searchParams]);
  if (!context) {
    redirect("/login");
  }
  if (!context.isAdmin) {
    redirect("/dashboard");
  }

  const requestedSectorCode = typeof query.sector === "string" ? query.sector : undefined;
  const activeSector =
    context.sectors.find((sector) => sector.code === requestedSectorCode) ?? context.sectors[0];

  if (!activeSector) {
    redirect("/dashboard");
  }

  const filters = { ...parseActivityLogFilters(query), sectorId: activeSector.id };
  const data = await getActivityLogPageData(filters);

  return (
    <main className="dashboard-page">
      <DashboardHeader
        identity={context.identity}
        sectors={context.sectors}
        activeSector={activeSector}
        isAdmin
        showActivityLogLink={false}
      />
      <Container className="dashboard-content" py="xl">
        <Stack gap="xl">
          <div>
            <Link href={`/dashboard?sector=${activeSector.code}`}>
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
              <Group align="center" wrap="nowrap">
                <ThemeIcon color="clubBlue" variant="light" radius="md" size="xl">
                  <IconHistory size={24} aria-hidden="true" />
                </ThemeIcon>
                <div>
                  <Title order={1}>Registro attività</Title>
                  <Text c="dimmed" mt={4}>
                    Consulta le operazioni eseguite su {activeSector.name}.
                  </Text>
                </div>
              </Group>
              <Text c="dimmed" size="sm">
                {data.totalItems} attività {data.totalItems === 1 ? "registrata" : "registrate"}
              </Text>
            </Group>
          </div>

          <ActivityFilters filters={filters} actors={data.actors} sectorCode={activeSector.code} />
          <ActivityLogList items={data.items} sectors={data.sectors} />
          <ActivityPagination currentPage={filters.page} totalPages={data.totalPages} />
        </Stack>
      </Container>
    </main>
  );
}
