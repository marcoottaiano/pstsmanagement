"use client";

import { Button, Group, List, Modal, Paper, Stack, Stepper, Text } from "@mantine/core";
import {
  IconBell,
  IconCalendarMonth,
  IconChartBar,
  IconListTree,
  IconTargetArrow,
  IconUserCircle,
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
  {
    title: "Profilo",
    icon: IconUserCircle,
    canDo: [
      "Modificare il nome visualizzato nell'applicazione.",
      "Personalizzare avatar, stile e colore di sfondo del profilo.",
      "Aggiornare la password inserendola due volte per conferma.",
    ],
    howTo: [
      "Apri il menu utente in alto a destra e scegli “Profilo”.",
      "Usa “Genera variante” per cambiare avatar senza modificare manualmente il codice della variante.",
      "La mail è visibile nei dati profilo ma non può essere modificata dall'applicazione.",
    ],
  },
] as const;

const ADMIN_GUIDE_STEP = {
  title: "Amministrazione",
  icon: IconChartBar,
  canDo: [
    "Consultare statistiche, carichi di lavoro, scadenze e KPI del settore selezionato.",
    "Generare e stampare il report mensile dalla pagina Statistiche.",
    "Esaminare il registro delle attività del settore selezionato.",
    "Invitare utenti, assegnare settori e gestire gli accessi.",
  ],
  howTo: [
    "Usa la select del settore nell'header per scegliere il contesto da analizzare.",
    "Apri il menu utente e scegli “Statistiche” per vedere KPI e report mensile esportabile.",
    "Usa “Registro attività” per filtrare le operazioni per utente, contenuto e periodo.",
  ],
} as const;

type HelpGuideProps = Readonly<{
  isAdmin?: boolean;
  opened?: boolean;
  onClose?: () => void;
}>;

export function HelpGuide({ isAdmin = false, opened: controlledOpened, onClose }: HelpGuideProps) {
  const [uncontrolledOpened, setUncontrolledOpened] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const opened = controlledOpened ?? uncontrolledOpened;
  const steps = isAdmin ? [...GUIDE_STEPS, ADMIN_GUIDE_STEP] : GUIDE_STEPS;

  function closeGuide(): void {
    setUncontrolledOpened(false);
    setActiveStep(0);
    onClose?.();
  }

  const lastStep = activeStep === steps.length - 1;

  return (
    <>
      <Modal
        opened={opened}
        onClose={closeGuide}
        title="Come usare PSTS Planner"
        centered
        size="min(64rem, calc(100vw - 1rem))"
        className="help-guide-modal"
      >
        <Stack gap="lg">
          <Text c="dimmed" size="sm">
            Scopri cosa puoi fare in ogni area e come usare le funzioni principali.
          </Text>

          <Stepper
            active={activeStep}
            size="sm"
            iconSize={32}
            allowNextStepsSelect={false}
            className="help-guide-stepper"
          >
            {steps.map((step) => {
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
              {activeStep + 1} di {steps.length}
            </Text>
            <Button
              onClick={() => {
                if (lastStep) {
                  closeGuide();
                  return;
                }
                setActiveStep((current) => Math.min(steps.length - 1, current + 1));
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
