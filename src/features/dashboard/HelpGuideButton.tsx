"use client";

import { ActionIcon, Tooltip } from "@mantine/core";
import { IconHelp } from "@tabler/icons-react";
import { useState } from "react";

import { HelpGuide } from "./HelpGuide";

type HelpGuideButtonProps = Readonly<{
  isAdmin: boolean;
}>;

export function HelpGuideButton({ isAdmin }: HelpGuideButtonProps) {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <Tooltip label="Guida rapida">
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          aria-label="Apri guida rapida"
          onClick={() => setOpened(true)}
        >
          <IconHelp size={20} aria-hidden="true" />
        </ActionIcon>
      </Tooltip>
      <HelpGuide isAdmin={isAdmin} opened={opened} onClose={() => setOpened(false)} />
    </>
  );
}
