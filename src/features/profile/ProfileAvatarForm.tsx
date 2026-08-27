"use client";

import {
  Alert,
  Avatar,
  Button,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { IconAlertCircle, IconCheck, IconRefresh } from "@tabler/icons-react";
import { useActionState, useState } from "react";

import {
  getAvatarDataUri,
  USER_AVATAR_BACKGROUNDS,
  USER_AVATAR_STYLES,
  type UserAvatar,
} from "@/features/avatar/avatar";

import { updateProfileAvatarAction } from "./profile.actions";
import type { ProfileAvatarActionState } from "./profile.types";

const initialState: ProfileAvatarActionState = {};

type ProfileAvatarFormProps = Readonly<{
  avatar: UserAvatar;
}>;

function createRandomSeed(): string {
  return crypto.randomUUID().slice(0, 8);
}

export function ProfileAvatarForm({ avatar }: ProfileAvatarFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfileAvatarAction, initialState);
  const [avatarStyle, setAvatarStyle] = useState(avatar.style);
  const [avatarSeed, setAvatarSeed] = useState(avatar.seed);
  const [avatarBackground, setAvatarBackground] = useState(avatar.background);
  const previewSrc = getAvatarDataUri({
    style: avatarStyle,
    seed: avatarSeed,
    background: avatarBackground,
  });

  return (
    <Paper withBorder p="lg">
      <form action={formAction} noValidate>
        <Stack gap="md">
          <Group align="center" gap="lg" wrap="nowrap">
            <Avatar src={previewSrc} size={96} radius="xl" />
            <div>
              <Text fw={700}>Avatar profilo</Text>
              <Text c="dimmed" size="sm">
                Scegli uno stile e genera una variante finché non trovi quella giusta.
              </Text>
            </div>
          </Group>

          {state.formError ? (
            <Alert color="red" icon={<IconAlertCircle size={18} aria-hidden="true" />} role="alert">
              {state.formError}
            </Alert>
          ) : null}
          {state.success ? (
            <Alert color="green" icon={<IconCheck size={18} aria-hidden="true" />} role="status">
              {state.success}
            </Alert>
          ) : null}

          <Select
            name="avatarStyle"
            label="Stile"
            data={USER_AVATAR_STYLES}
            value={avatarStyle}
            onChange={(value) => {
              if (value) {
                setAvatarStyle(value as UserAvatar["style"]);
              }
            }}
            error={state.fieldErrors?.avatarStyle}
            disabled={isPending}
            allowDeselect={false}
          />
          <Stack gap="xs">
            <Text fw={500} size="sm">
              Sfondo
            </Text>
            <Group gap="xs">
              {USER_AVATAR_BACKGROUNDS.map((background) => (
                <UnstyledButton
                  key={background.value}
                  type="button"
                  className="profile-avatar-background-swatch"
                  style={{ backgroundColor: `#${background.value}` }}
                  data-selected={avatarBackground === background.value || undefined}
                  aria-label={`Sfondo ${background.label}`}
                  onClick={() => setAvatarBackground(background.value)}
                  disabled={isPending}
                />
              ))}
            </Group>
            {state.fieldErrors?.avatarBackground ? (
              <Text c="red" size="sm">
                {state.fieldErrors.avatarBackground}
              </Text>
            ) : null}
          </Stack>
          <input type="hidden" name="avatarBackground" value={avatarBackground} />
          <input type="hidden" name="avatarSeed" value={avatarSeed} />
          {state.fieldErrors?.avatarSeed ? (
            <Text c="red" size="sm">
              {state.fieldErrors.avatarSeed}
            </Text>
          ) : null}

          <Group justify="space-between">
            <Button
              type="button"
              variant="light"
              leftSection={<IconRefresh size={16} aria-hidden="true" />}
              onClick={() => setAvatarSeed(createRandomSeed())}
              disabled={isPending}
            >
              Genera variante
            </Button>
            <Button type="submit" loading={isPending}>
              Salva avatar
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}
