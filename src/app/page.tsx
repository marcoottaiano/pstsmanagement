import {
  Badge,
  Box,
  Container,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconCalendar, IconLock, IconUsersGroup } from "@tabler/icons-react";

import { APP_CONFIG } from "@/config/app.config";

const foundations = [
  {
    icon: IconLock,
    title: "Accesso sicuro",
    description: "Autenticazione e autorizzazione saranno gestite da Supabase con RLS.",
  },
  {
    icon: IconUsersGroup,
    title: "Gruppi gerarchici",
    description: "Categorie e gruppi supporteranno una struttura ricorsiva e filtrabile.",
  },
  {
    icon: IconCalendar,
    title: "Pianificazione annuale",
    description: "Calendario, promemoria e obiettivi confluiranno in un’unica dashboard.",
  },
] as const;

export default function HomePage() {
  return (
    <Box component="main" className="foundation-page">
      <Container size="lg" py={{ base: 48, sm: 80 }}>
        <Stack gap="xl">
          <Stack gap="sm" maw={720}>
            <Badge variant="light" size="lg" w="fit-content">
              Fondazione tecnica
            </Badge>
            <Title order={1}>{APP_CONFIG.name}</Title>
            <Text c="dimmed" size="lg">
              La base applicativa è pronta per autenticazione, dati e dashboard operativa.
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
            {foundations.map(({ icon: Icon, title, description }) => (
              <Paper key={title} withBorder p="xl" shadow="xs">
                <Stack gap="md">
                  <ThemeIcon size={44} radius="md" variant="light" aria-hidden="true">
                    <Icon size={24} stroke={1.8} />
                  </ThemeIcon>
                  <Stack gap={6}>
                    <Title order={2} size="h4">
                      {title}
                    </Title>
                    <Text c="dimmed" size="sm">
                      {description}
                    </Text>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}
