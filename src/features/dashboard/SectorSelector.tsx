import { Alert, Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

import type { Sector } from "@/features/auth/auth.types";

type SectorSelectorProps = Readonly<{
  sectors: readonly Sector[];
  activeSector?: Sector;
  selectionError?: boolean;
  prominent?: boolean;
}>;

export function SectorSelector({
  sectors,
  activeSector,
  selectionError = false,
  prominent = false,
}: SectorSelectorProps) {
  const content = (
    <Stack gap="md">
      {prominent ? (
        <div>
          <Title order={2} size="h3">
            Scegli il settore
          </Title>
          <Text c="dimmed" size="sm" mt={4}>
            Seleziona il settore con cui vuoi lavorare.
          </Text>
        </div>
      ) : (
        <Text fw={600} size="sm">
          Settore attivo
        </Text>
      )}

      {selectionError ? (
        <Alert color="orange" icon={<IconAlertCircle size={18} aria-hidden="true" />} role="alert">
          Il settore richiesto non è disponibile per il tuo account. Selezionane uno autorizzato.
        </Alert>
      ) : null}

      <Group gap="sm">
        {sectors.map((sector) => (
          <Button
            key={sector.id}
            component="a"
            href={`/dashboard?sector=${sector.code}`}
            variant={activeSector?.id === sector.id ? "filled" : "light"}
            aria-current={activeSector?.id === sector.id ? "page" : undefined}
          >
            {sector.name}
          </Button>
        ))}
      </Group>
    </Stack>
  );

  return prominent ? (
    <Paper withBorder shadow="xs" p={{ base: "lg", sm: "xl" }} maw={620} mx="auto">
      {content}
    </Paper>
  ) : (
    content
  );
}
