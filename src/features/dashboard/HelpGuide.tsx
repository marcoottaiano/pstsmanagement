"use client";

import {
  ActionIcon,
  Button,
  Group,
  List,
  Modal,
  Paper,
  Stack,
  Stepper,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconBell,
  IconCalendarMonth,
  IconHelp,
  IconListTree,
  IconTargetArrow,
} from "@tabler/icons-react";
import { useState } from "react";

const GUIDE_STEPS = [
  {
    title: "Gruppi",
    icon: IconListTree,
    canDo: [
      "Creare categorie e gruppi organizzati su più livelli.",
      "Spostare, riordinare, archiviare e ripristinare gli elementi della struttura.",
      "Filtrare tutta la dashboard includendo automaticamente i gruppi discendenti.",
    ],
    howTo: [
      "Apri “Gestisci struttura” per creare o modificare categorie e gruppi.",
      "Usa i menu “Categoria o gruppo” e “Livello” per restringere la dashboard.",
      "Premi “Azzera filtro” per tornare alla vista generale del settore.",
    ],
  },
  {
    title: "Calendario",
    icon: IconCalendarMonth,
    canDo: [
      "Visualizzare insieme lavori programmati e promemoria con scadenza.",
      "Creare, modificare ed eliminare un lavoro programmato.",
      "Cambiare le date trascinando o ridimensionando un evento.",
    ],
    howTo: [
      "Premi “Nuovo lavoro” oppure clicca direttamente sul giorno interessato.",
      "Clicca un evento per aprire i relativi dettagli e modificarlo.",
      "Trascina un evento su un’altra data: il cambiamento viene salvato automaticamente.",
    ],
  },
  {
    title: "Promemoria",
    icon: IconBell,
    canDo: [
      "Creare promemoria personali oppure associati a un gruppo.",
      "Impostare priorità, scadenza e uno o più assegnatari.",
      "Completare e riaprire rapidamente un promemoria.",
    ],
    howTo: [
      "Premi “Nuovo” nel pannello Promemoria e compila almeno il titolo.",
      "Aggiungi una data per mostrare il promemoria anche nel calendario.",
      "Clicca la card per modificarla oppure usa la spunta per completarla.",
    ],
  },
  {
    title: "Obiettivi",
    icon: IconTargetArrow,
    canDo: [
      "Definire obiettivi per un gruppo concreto, con stato e periodo opzionale.",
      "Visualizzare anche gli obiettivi dei gruppi discendenti.",
      "Aggiornare lo stato oppure completare e riaprire un obiettivo.",
    ],
    howTo: [
      "Seleziona prima un gruppo o una categoria: gli obiettivi sono nascosti nella vista generale.",
      "Premi “Nuovo” e scegli il gruppo a cui associare l’obiettivo.",
      "Clicca la card per modificarla oppure usa la spunta per completarla.",
    ],
  },
] as const;

export function HelpGuide() {
  const [opened, setOpened] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  function closeGuide(): void {
    setOpened(false);
    setActiveStep(0);
  }

  const lastStep = activeStep === GUIDE_STEPS.length - 1;

  return (
    <>
      <Tooltip label="Guida rapida">
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          onClick={() => setOpened(true)}
          aria-label="Apri la guida rapida"
        >
          <IconHelp size={20} aria-hidden="true" />
        </ActionIcon>
      </Tooltip>

      <Modal
        opened={opened}
        onClose={closeGuide}
        title="Come usare PSTS Planner"
        centered
        size="min(52rem, calc(100vw - 1rem))"
        className="help-guide-modal"
      >
        <Stack gap="lg">
          <Text c="dimmed" size="sm">
            Scopri cosa puoi fare in ogni area e come usare le funzioni principali.
          </Text>

          <Stepper active={activeStep} size="sm" iconSize={32} allowNextStepsSelect={false}>
            {GUIDE_STEPS.map((step) => {
              const StepIcon = step.icon;
              return (
                <Stepper.Step
                  key={step.title}
                  label={step.title}
                  icon={<StepIcon size={17} aria-hidden="true" />}
                  aria-label={step.title}
                >
                  <Paper withBorder p={{ base: "md", sm: "lg" }} mt="lg">
                    <Stack gap="lg">
                      <div>
                        <Text fw={700} mb="xs">
                          Cosa puoi fare
                        </Text>
                        <List size="sm" spacing="xs">
                          {step.canDo.map((item) => (
                            <List.Item key={item}>{item}</List.Item>
                          ))}
                        </List>
                      </div>

                      <div>
                        <Text fw={700} mb="xs">
                          Come si usa
                        </Text>
                        <List type="ordered" size="sm" spacing="xs">
                          {step.howTo.map((item) => (
                            <List.Item key={item}>{item}</List.Item>
                          ))}
                        </List>
                      </div>
                    </Stack>
                  </Paper>
                </Stepper.Step>
              );
            })}
          </Stepper>

          <Group justify="space-between" wrap="nowrap">
            <Button
              variant="default"
              onClick={() => setActiveStep((current) => Math.max(0, current - 1))}
              disabled={activeStep === 0}
            >
              Indietro
            </Button>
            <Text c="dimmed" size="xs" aria-live="polite">
              {activeStep + 1} di {GUIDE_STEPS.length}
            </Text>
            <Button
              onClick={() => {
                if (lastStep) {
                  closeGuide();
                  return;
                }
                setActiveStep((current) => Math.min(GUIDE_STEPS.length - 1, current + 1));
              }}
            >
              {lastStep ? "Chiudi" : "Avanti"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
