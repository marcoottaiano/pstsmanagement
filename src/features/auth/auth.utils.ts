export function getInitials(displayName: string): string {
  const words = displayName.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "U";
  }

  const firstInitial = words[0]?.charAt(0) ?? "";
  const lastInitial = words.length > 1 ? (words.at(-1)?.charAt(0) ?? "") : "";

  return `${firstInitial}${lastInitial}`.toLocaleUpperCase("it-IT");
}

export function getFallbackDisplayName(email: string | null): string {
  const emailLocalPart = email?.split("@")[0]?.trim();
  return emailLocalPart || "Utente";
}
