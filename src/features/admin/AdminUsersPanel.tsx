"use client";

import { Badge, Button, Group, Paper, Select, Stack, Table, Text, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconMailPlus, IconSearch, IconSettings, IconTrash } from "@tabler/icons-react";
import { useState } from "react";

import type { Sector } from "@/features/auth/auth.types";

import type { ManagedUser, ManagedUserStatus } from "./admin.types";
import { DeleteUserModal } from "./DeleteUserModal";
import { InviteUserModal } from "./InviteUserModal";
import { UserAccessModal } from "./UserAccessModal";

type AdminUsersPanelProps = Readonly<{
  users: readonly ManagedUser[];
  sectors: readonly Sector[];
}>;

const STATUS_LABELS: Record<ManagedUserStatus, string> = {
  ACTIVE: "Attivo",
  INVITED: "Invitato",
  SUSPENDED: "Sospeso",
};

const STATUS_COLORS: Record<ManagedUserStatus, string> = {
  ACTIVE: "green",
  INVITED: "yellow",
  SUSPENDED: "red",
};

function formatDate(value: string | null): string {
  if (!value) {
    return "Mai";
  }

  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Rome",
  }).format(new Date(value));
}

export function AdminUsersPanel({ users, sectors }: AdminUsersPanelProps) {
  const [inviteOpened, inviteHandlers] = useDisclosure(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const normalizedSearch = search.trim().toLocaleLowerCase("it-IT");
  const visibleUsers = users.filter(
    (user) =>
      (!normalizedSearch ||
        user.displayName.toLocaleLowerCase("it-IT").includes(normalizedSearch) ||
        user.email.toLocaleLowerCase("it-IT").includes(normalizedSearch)) &&
      (!status || user.status === status),
  );
  const sectorNamesById = new Map(sectors.map((sector) => [sector.id, sector.name]));

  return (
    <>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end">
          <Group align="flex-end" className="admin-user-filters">
            <TextInput
              label="Cerca utenti"
              placeholder="Nome o email"
              leftSection={<IconSearch size={16} aria-hidden="true" />}
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
            />
            <Select
              label="Stato"
              placeholder="Tutti"
              clearable
              value={status}
              onChange={setStatus}
              data={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </Group>
          <Button
            leftSection={<IconMailPlus size={18} aria-hidden="true" />}
            onClick={inviteHandlers.open}
          >
            Invita utente
          </Button>
        </Group>

        <Paper withBorder shadow="xs">
          <Table.ScrollContainer minWidth={850}>
            <Table striped highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Utente</Table.Th>
                  <Table.Th>Ruolo</Table.Th>
                  <Table.Th>Stato</Table.Th>
                  <Table.Th>Settori</Table.Th>
                  <Table.Th>Ultimo accesso</Table.Th>
                  <Table.Th ta="right">Azioni</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {visibleUsers.map((user) => (
                  <Table.Tr key={user.id}>
                    <Table.Td>
                      <Text fw={600} size="sm">
                        {user.displayName}
                      </Text>
                      <Text c="dimmed" size="xs">
                        {user.email}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={user.role === "ADMIN" ? "blue" : "gray"} variant="light">
                        {user.role === "ADMIN" ? "Admin" : "Utente"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={STATUS_COLORS[user.status]} variant="light">
                        {STATUS_LABELS[user.status]}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} wrap="wrap">
                        {user.sectorIds.length > 0 ? (
                          user.sectorIds.map((sectorId) => (
                            <Badge key={sectorId} color="grape" variant="outline">
                              {sectorNamesById.get(sectorId) ?? "Settore non disponibile"}
                            </Badge>
                          ))
                        ) : (
                          <Text c="dimmed" size="sm">
                            Nessun settore
                          </Text>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatDate(user.lastSignInAt)}</Text>
                    </Table.Td>
                    <Table.Td ta="right">
                      <Group gap="xs" justify="flex-end" wrap="nowrap">
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<IconSettings size={15} aria-hidden="true" />}
                          onClick={() => setSelectedUser(user)}
                        >
                          Gestisci accessi
                        </Button>
                        {user.role === "MEMBER" ? (
                          <Button
                            size="xs"
                            variant="light"
                            color="red"
                            leftSection={<IconTrash size={15} aria-hidden="true" />}
                            onClick={() => setUserToDelete(user)}
                            aria-label={`Elimina ${user.displayName}`}
                          >
                            Elimina
                          </Button>
                        ) : null}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
          {visibleUsers.length === 0 ? (
            <Text c="dimmed" ta="center" p="xl">
              Nessun utente corrisponde ai filtri selezionati.
            </Text>
          ) : null}
        </Paper>
      </Stack>

      <InviteUserModal opened={inviteOpened} sectors={sectors} onClose={inviteHandlers.close} />
      {selectedUser ? (
        <UserAccessModal
          key={selectedUser.id}
          user={selectedUser}
          sectors={sectors}
          onClose={() => setSelectedUser(null)}
        />
      ) : null}
      {userToDelete ? (
        <DeleteUserModal
          key={userToDelete.id}
          user={userToDelete}
          onClose={() => setUserToDelete(null)}
        />
      ) : null}
    </>
  );
}
