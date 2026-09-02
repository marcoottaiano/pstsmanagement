"use client";

import {
  Button,
  Group,
  List,
  Modal,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
  Card,
} from "@mantine/core";
import {
  IconBell,
  IconCalendarMonth,
  IconChartBar,
  IconListTree,
  IconTargetArrow,
  IconUserCircle,
  IconInfoCircle,
  IconArrowRight,
} from "@tabler/icons-react";
import { useState, useRef, useEffect } from "react";

const QUICK_START_SECTION = {
  title: "🚀 Guida Rapida - Primi Passi",
  description:
    "Se sei nuovo, segui questi semplici passaggi per iniziare a usare PSTS Planner in 5 minuti.",
  steps: [
    {
      number: 1,
      title: "Completare il Profilo",
      description:
        "Clicca il menu utente in alto a destra e seleziona 'Profilo'. Aggiungi una foto e personalizza il tuo avatar. Questo aiuta gli altri a identificarti nel team.",
      icon: IconUserCircle,
    },
    {
      number: 2,
      title: "Strutturare i Gruppi",
      description:
        "I 'Gruppi' sono come cartelle che organizzano il tuo settore. Clicca 'Gestisci gruppi' per creare una struttura gerarchica (es: Settore > Team > Progetto).",
      icon: IconListTree,
    },
    {
      number: 3,
      title: "Creare il Primo Lavoro",
      description:
        "Nel Calendario, clicca 'Nuovo lavoro' o direttamente su un giorno. Aggiungi titolo, uno o più gruppi e la data. Vedrai il lavoro nella timeline.",
      icon: IconCalendarMonth,
    },
    {
      number: 4,
      title: "Aggiungere Promemoria",
      description:
        "Nel pannello 'Promemoria', clicca 'Nuovo', inserisci il titolo, scegli i gruppi se servono, imposta la scadenza e salva.",
      icon: IconBell,
    },
    {
      number: 5,
      title: "Definire Obiettivi",
      description:
        "Per ogni gruppo, puoi impostare Obiettivi (goals di lungo termine). Seleziona un gruppo, vai in 'Obiettivi', clicca 'Nuovo' e descrivi cosa vuoi raggiungere.",
      icon: IconTargetArrow,
    },
  ],
} as const;

const GUIDE_STEPS = [
  {
    title: "Gruppi",
    icon: IconListTree,
    emoji: "📁",
    shortDescription: "Organizza il tuo settore in una struttura gerarchica",
    canDo: [
      "Creare gruppi e sottogruppi su più livelli (es: Settore → Area → Team → Progetto).",
      "Spostare, riordinare, archiviare e ripristinare i gruppi senza perdere i dati.",
      "Filtrare la dashboard per visualizzare solo un gruppo e i suoi sottogruppi.",
      "Gestire rapidamente la struttura organizzativa da un'unica pagina.",
    ],
    tips: [
      "💡 Pensa ai Gruppi come alle cartelle del tuo computer - organizza per come lavori.",
      "💡 Puoi avere quanti livelli di profondità vuoi, ma 3-4 è generalmente ottimale.",
      "💡 Archiviare un gruppo non cancella i dati, li nasconde solo dalla vista principale.",
    ],
    howTo: [
      "Clicca il pulsante 'Gestisci gruppi' nella dashboard per aprire l'editor di struttura.",
      "Seleziona + per aggiungere un nuovo gruppo, oppure clicca su un gruppo per le opzioni.",
      "Usa i menu 'Gruppo' e 'Sottogruppo' in alto per filtrare immediatamente la dashboard.",
      "Clicca 'Azzera filtro' per tornare alla vista generale del settore.",
    ],
  },
  {
    title: "Calendario",
    icon: IconCalendarMonth,
    emoji: "📅",
    shortDescription: "Visualizza e gestisci tutto ciò che è programmato",
    canDo: [
      "Visualizzare insieme lavori programmati, promemoria e scadenze in una vista settimanale o mensile.",
      "Creare, modificare, duplicare ed eliminare un lavoro programmato rapidamente.",
      "Cambiare le date trascinando un evento su un'altra data o ridimensionandolo.",
      "Colorare i lavori per categoria per una migliore visualizzazione visuale.",
    ],
    tips: [
      "💡 Trascina gli eventi direttamente nel calendario - i cambiamenti si salvano automaticamente.",
      "💡 Clicca un evento per aprire i dettagli completi e modificare informazioni come priorità.",
      "💡 Usa la vista mensile per una panoramica generale, la vista settimanale per i dettagli.",
    ],
    howTo: [
      "Clicca il pulsante 'Nuovo lavoro' oppure clicca direttamente sul giorno interessato nel calendario.",
      "Compila il titolo, assegna il lavoro a uno o più gruppi e imposta la data di inizio e fine.",
      "Per modificare, clicca l'evento nel calendario per aprire la modal di dettagli.",
      "Trascina l'evento su un'altra data: il cambiamento viene salvato automaticamente.",
    ],
  },
  {
    title: "Promemoria",
    icon: IconBell,
    emoji: "🔔",
    shortDescription: "Crea reminder personali o di gruppo con scadenze",
    canDo: [
      "Creare promemoria personali per te o associati a uno o più gruppi.",
      "Impostare priorità (bassa, media, alta, urgente), scadenza e più assegnatari.",
      "Completare un promemoria e riaprirlo se serve ricominciare da dove l'hai lasciato.",
      "Visualizzare i promemoria sia nel pannello dedicato che nel Calendario (se hanno una data).",
    ],
    tips: [
      "💡 I promemoria senza data non appaiono nel calendario, ma rimangono nella lista.",
      "💡 Usa i promemoria per attività ricorrenti o cose da ricordare, i Lavori per progetti con data.",
      "💡 Puoi assegnare lo stesso promemoria a più persone - perfetto per task di team.",
    ],
    howTo: [
      "Nel pannello Promemoria sulla destra, clicca il pulsante 'Nuovo' per creare un promemoria.",
      "Compila almeno il titolo (obbligatorio), poi aggiungi data, priorità e assegnatari se vuoi.",
      "Clicca la card per modificarla oppure usa la spunta per segnarlo come completato.",
      "Un promemoria completato non scompare, ma viene spostato nella sezione 'Completati'.",
    ],
  },
  {
    title: "Obiettivi",
    icon: IconTargetArrow,
    emoji: "🎯",
    shortDescription: "Definisci target e goal per i tuoi gruppi",
    canDo: [
      "Definire Obiettivi (goals e target) per qualunque gruppo, con stato di avanzamento.",
      "Visualizzare gli obiettivi del gruppo selezionato e automaticamente quelli discendenti.",
      "Aggiornare lo stato di completamento oppure riaprire un obiettivo se serve riprenderlo.",
      "Associare ogni obiettivo a un periodo di tempo (es: Q1 2026) per tracciare progressi.",
    ],
    tips: [
      "💡 Gli Obiettivi sono invisibili nella vista generale - devi selezionare un gruppo.",
      "💡 Usa gli Obiettivi per cose strategiche e di lungo termine (OKR, target annuali).",
      "💡 Gli obiettivi di gruppi 'figli' sono visibili anche quando guardi un gruppo 'genitore'.",
    ],
    howTo: [
      "Seleziona prima un gruppo: gli obiettivi sono filtrati per gruppo.",
      "Nel pannello Obiettivi, clicca 'Nuovo' e scegli il gruppo a cui associare l'obiettivo.",
      "Scrivi il titolo dell'obiettivo, scegli uno stato iniziale (es: In Progresso) e salva.",
      "Clicca la card per modificarla oppure usa la spunta per segnarlo come completato.",
    ],
  },
  {
    title: "Profilo",
    icon: IconUserCircle,
    emoji: "👤",
    shortDescription: "Personalizza il tuo account e le tue preferenze",
    canDo: [
      "Modificare il nome visualizzato nell'applicazione (il tuo display name che vedono gli altri).",
      "Personalizzare avatar con stile, colori e background per una tua identità visiva.",
      "Aggiornare la password in qualsiasi momento per motivi di sicurezza.",
      "Visualizzare la tua email registrata (non modificabile da qui per motivi di sicurezza).",
    ],
    tips: [
      "💡 Il tuo avatar è visibile a tutti quando accedi a gruppi condivisi - scegli qualcosa di rappresentativo.",
      "💡 Puoi usare 'Genera variante' per creare avatar casuali finché non trovi uno che ti piace.",
      "💡 Il nome visualizzato non è l'email - puoi usare il tuo nome reale, nickname o quello che preferisci.",
    ],
    howTo: [
      "Apri il menu utente in alto a destra (il tuo avatar o nome) e seleziona 'Profilo'.",
      "Modifica il Nome visualizzato nel primo campo e salva.",
      "Nella sezione Avatar, clicca 'Genera variante' più volte finché non trovi uno che ti piace.",
      "Per cambiare la password, scorri fino alla fine e clicca 'Cambia Password', inseriscila due volte per conferma.",
    ],
  },
] as const;

const ADMIN_GUIDE_STEP = {
  title: "Amministrazione",
  icon: IconChartBar,
  emoji: "📊",
  shortDescription: "Gestisci il settore, visualizza statistiche e reports",
  canDo: [
    "Consultare statistiche, carichi di lavoro, scadenze e KPI del settore selezionato.",
    "Generare e stampare il report mensile dalla pagina Statistiche.",
    "Esaminare il registro delle attività del settore selezionato.",
    "Invitare utenti, assegnare settori e gestire gli accessi.",
  ],
  tips: [
    "💡 Usa la select del settore nell'header per scegliere il contesto da analizzare.",
    "💡 I reports sono esportabili in formato stampabile per presentazioni.",
    "💡 Il Registro attività registra chi ha fatto cosa e quando - utile per audit.",
  ],
  howTo: [
    "Usa la select del settore nell'header per scegliere il contesto da analizzare.",
    "Apri il menu utente e scegli 'Statistiche' per vedere KPI e report mensile esportabile.",
    "Usa 'Registro attività' per filtrare le operazioni per utente, contenuto e periodo.",
    "Nella sezione 'Gestione Utenti', invita nuovi utenti e assegna loro i settori appropriati.",
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
  const [isQuickStartMode, setIsQuickStartMode] = useState(true);
  const opened = controlledOpened ?? uncontrolledOpened;
  const steps = isAdmin ? [...GUIDE_STEPS, ADMIN_GUIDE_STEP] : GUIDE_STEPS;
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Scroll to top quando cambia lo step
  useEffect(() => {
    const modalContent = modalContentRef.current?.closest<HTMLElement>("[data-modal-content]");
    modalContent?.scrollTo({ top: 0 });
  }, [activeStep, isQuickStartMode]);

  function closeGuide(): void {
    setUncontrolledOpened(false);
    setActiveStep(0);
    setIsQuickStartMode(true);
    onClose?.();
  }

  const lastStep = activeStep === steps.length - 1;

  return (
    <>
      <Modal
        opened={opened}
        onClose={closeGuide}
        title="🎓 Guida di PSTS Planner"
        centered
        size="xl"
        className="help-guide-modal"
        styles={{
          content: {
            maxHeight: "90vh",
            overflowY: "auto",
          },
          body: {
            padding: "var(--mantine-spacing-md)",
          },
        }}
      >
        <Stack gap="lg" ref={modalContentRef}>
          {isQuickStartMode ? (
            // QUICK START MODE
            <Stack gap="md">
              <div>
                <Text fw={600} size="md" mb="xs" c="dimmed">
                  Benvenuto in PSTS Planner! 👋
                </Text>
                <Text size="sm" mb="md">
                  Questo strumento ti aiuta a organizzare il tuo settore, gestire progetti,
                  promemoria e obiettivi in un unico posto. Se è la prima volta che lo usi, segui
                  questi passaggi semplici per imparare le basi.
                </Text>
              </div>

              <Stack gap="md">
                {QUICK_START_SECTION.steps.map((step) => {
                  const StepIcon = step.icon;
                  return (
                    <Card
                      key={step.number}
                      withBorder
                      p="md"
                      radius="md"
                      style={{
                        backgroundColor: "rgba(59, 130, 246, 0.02)",
                        borderColor: "rgba(59, 130, 246, 0.1)",
                      }}
                    >
                      <Group wrap="nowrap" align="flex-start" gap="sm">
                        <ThemeIcon
                          size="lg"
                          radius="md"
                          variant="light"
                          color="blue"
                          style={{ flexShrink: 0 }}
                        >
                          <Text fw={700} size="lg">
                            {step.number}
                          </Text>
                        </ThemeIcon>
                        <Stack gap="xs" flex={1} style={{ minWidth: 0 }}>
                          <Group wrap="nowrap" justify="space-between" align="center" gap="xs">
                            <Text fw={600} size="sm" flex={1}>
                              {step.title}
                            </Text>
                            <StepIcon size={20} opacity={0.5} style={{ flexShrink: 0 }} />
                          </Group>
                          <Text size="xs" c="dimmed" style={{ lineHeight: 1.5 }}>
                            {step.description}
                          </Text>
                        </Stack>
                      </Group>
                    </Card>
                  );
                })}
              </Stack>

              <Paper withBorder p="md" radius="md" bg="yellow.0" c="yellow.9">
                <Group wrap="nowrap" gap="sm" align="flex-start">
                  <IconInfoCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                  <Text size="xs" style={{ lineHeight: 1.5 }}>
                    <strong>Consiglio:</strong> Dopo questi 5 passaggi, esplora le sezioni qui sotto
                    per scoprire tutte le funzionalità disponibili.
                  </Text>
                </Group>
              </Paper>

              <Group justify="space-between" wrap="wrap" gap="sm" mt="lg">
                <Button variant="default" onClick={closeGuide} flex={1}>
                  Chiudi
                </Button>
                <Button
                  onClick={() => {
                    setIsQuickStartMode(false);
                    setActiveStep(0);
                  }}
                  flex={1}
                >
                  Scopri di più <IconArrowRight size={18} style={{ marginLeft: 8 }} />
                </Button>
              </Group>
            </Stack>
          ) : (
            // DETAILED GUIDE MODE
            <>
              <Text c="dimmed" size="sm">
                Scopri cosa puoi fare in ogni area e come usare le funzioni principali.
              </Text>

              <nav aria-label="Sezioni della guida">
                <div className="help-guide-navigation">
                  {steps.map((step, index) => {
                    const StepIcon = step.icon;

                    return (
                      <UnstyledButton
                        key={step.title}
                        className="help-guide-navigation-item"
                        data-active={index === activeStep || undefined}
                        data-completed={index < activeStep || undefined}
                        disabled={index > activeStep}
                        aria-current={index === activeStep ? "step" : undefined}
                        onClick={() => setActiveStep(index)}
                      >
                        <ThemeIcon
                          size="md"
                          radius="xl"
                          variant={index === activeStep ? "filled" : "light"}
                          color="blue"
                        >
                          <StepIcon size={16} aria-hidden="true" />
                        </ThemeIcon>
                        <Text
                          component="span"
                          className="help-guide-navigation-label"
                          size="sm"
                          fw={600}
                        >
                          {step.title}
                        </Text>
                      </UnstyledButton>
                    );
                  })}
                </div>
              </nav>

              {steps.map((step, index) => {
                if (index !== activeStep) {
                  return null;
                }

                return (
                  <Paper key={step.title} withBorder p="lg" radius="md">
                    <Stack gap="lg">
                      {/* Section Header */}
                      <div>
                        <Group wrap="nowrap" gap="sm" align="center" mb="sm">
                          <Text size="2xl">{step.emoji}</Text>
                          <div style={{ flex: 1 }}>
                            <Text fw={700} size="lg">
                              {step.title}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {step.shortDescription}
                            </Text>
                          </div>
                        </Group>
                      </div>

                      {/* Cosa puoi fare */}
                      <div>
                        <Text fw={700} mb="xs" size="sm">
                          ✓ Cosa puoi fare
                        </Text>
                        <List size="sm" spacing="md">
                          {step.canDo.map((item) => (
                            <List.Item key={item} style={{ lineHeight: 1.5 }}>
                              {item}
                            </List.Item>
                          ))}
                        </List>
                      </div>

                      {/* Tips */}
                      {step.tips && step.tips.length > 0 && (
                        <Paper withBorder p="md" radius="md" bg="blue.0" c="blue.9">
                          <Text fw={700} mb="xs" size="xs">
                            💡 Consigli Utili
                          </Text>
                          <List size="xs" spacing="xs">
                            {step.tips.map((tip) => (
                              <List.Item key={tip}>{tip}</List.Item>
                            ))}
                          </List>
                        </Paper>
                      )}

                      {/* Come si usa */}
                      <div>
                        <Text fw={700} mb="xs" size="sm">
                          📍 Come si usa
                        </Text>
                        <List type="ordered" size="sm" spacing="md">
                          {step.howTo.map((item) => (
                            <List.Item key={item} style={{ lineHeight: 1.5 }}>
                              {item}
                            </List.Item>
                          ))}
                        </List>
                      </div>
                    </Stack>
                  </Paper>
                );
              })}

              <Group justify="space-between" wrap="wrap" gap="sm">
                <Button
                  variant="default"
                  onClick={() => {
                    if (activeStep === 0) {
                      setIsQuickStartMode(true);
                    } else {
                      setActiveStep((current) => Math.max(0, current - 1));
                    }
                  }}
                  flex={1}
                >
                  {activeStep === 0 ? "Guida Rapida" : "Indietro"}
                </Button>
                <Text c="dimmed" size="xs" ta="center">
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
                  flex={1}
                >
                  {lastStep ? "Chiudi" : "Avanti"}
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Modal>
    </>
  );
}
