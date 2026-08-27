import { createAvatar } from "@dicebear/core";
import { adventurerNeutral, botttsNeutral, funEmoji } from "@dicebear/collection";

export const USER_AVATAR_STYLES = [
  { value: "adventurerNeutral", label: "Adventurer neutral" },
  { value: "funEmoji", label: "Fun emoji" },
  { value: "botttsNeutral", label: "Voxel bot" },
] as const;

export const USER_AVATAR_BACKGROUNDS = [
  { value: "f8d7da", label: "Rosa" },
  { value: "ffe8cc", label: "Pesca" },
  { value: "fff3bf", label: "Vaniglia" },
  { value: "d3f9d8", label: "Menta" },
  { value: "c3fae8", label: "Acqua" },
  { value: "d0ebff", label: "Cielo" },
  { value: "dbe4ff", label: "Lavanda" },
  { value: "e5dbff", label: "Glicine" },
  { value: "fde2e4", label: "Cipria" },
  { value: "f1f3f5", label: "Neutro" },
] as const;

export type UserAvatarStyle = (typeof USER_AVATAR_STYLES)[number]["value"];
export type UserAvatarBackground = (typeof USER_AVATAR_BACKGROUNDS)[number]["value"];

export const DEFAULT_USER_AVATAR_STYLE: UserAvatarStyle = "adventurerNeutral";
export const DEFAULT_USER_AVATAR_BACKGROUND: UserAvatarBackground = "f1f3f5";

export type UserAvatar = Readonly<{
  style: UserAvatarStyle;
  seed: string;
  background: UserAvatarBackground;
}>;

const AVATAR_STYLE_VALUES = new Set<string>(USER_AVATAR_STYLES.map((style) => style.value));
const AVATAR_BACKGROUND_VALUES = new Set<string>(
  USER_AVATAR_BACKGROUNDS.map((background) => background.value),
);

export function isUserAvatarStyle(value: string): value is UserAvatarStyle {
  return AVATAR_STYLE_VALUES.has(value);
}

export function isUserAvatarBackground(value: string): value is UserAvatarBackground {
  return AVATAR_BACKGROUND_VALUES.has(value);
}

export function getDefaultAvatarSeed(displayName: string, email: string | null): string {
  return displayName.trim() || email?.trim() || "utente";
}

export function getAvatarDataUri(avatar: UserAvatar): string {
  const options = {
    seed: avatar.seed,
    size: 96,
    radius: 50,
    backgroundColor: [avatar.background],
  };

  switch (avatar.style) {
    case "adventurerNeutral":
      return createAvatar(adventurerNeutral, options).toDataUri();
    case "funEmoji":
      return createAvatar(funEmoji, options).toDataUri();
    case "botttsNeutral":
      return createAvatar(botttsNeutral, options).toDataUri();
  }
}
