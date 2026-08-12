import { Container, Paper, Skeleton, Stack } from "@mantine/core";

export default function DashboardLoading() {
  return (
    <main className="dashboard-page" aria-busy="true" aria-label="Caricamento dashboard">
      <div className="dashboard-header">
        <Skeleton height={42} width={220} />
      </div>
      <Container size="xl" py="lg">
        <Stack gap="lg">
          <Paper withBorder p="md">
            <Skeleton height={36} width={320} maw="100%" />
          </Paper>
          <Skeleton height={420} radius="lg" />
        </Stack>
      </Container>
    </main>
  );
}
