# Requisiti funzionali della pagina principale

## 1. Struttura generale della pagina

Dopo aver effettuato l’accesso, l’utente visualizzerà un’unica pagina operativa.

La pagina manterrà sempre la stessa struttura e i contenuti mostrati verranno aggiornati in base ai filtri selezionati.

La pagina sarà composta da:

- un’intestazione superiore;
- una barra per la selezione e la gestione dei gruppi;
- un calendario centrale;
- una colonna laterale contenente i promemoria e gli obiettivi.

## 2. Intestazione

Nella parte superiore della pagina saranno presenti:

- il logo della società, posizionato a sinistra;
- il nome dell’utente autenticato, posizionato a destra;
- un’icona o un’immagine identificativa dell’utente;
- il comando per effettuare il logout.

## 3. Organizzazione gerarchica dei gruppi

I corsi saranno organizzati attraverso una struttura gerarchica ad albero.

La struttura potrà essere composta da più livelli, ad esempio:

```text
Avanzato
├── Avanzato 1
│   ├── Eccellenza 1
│   └── Eccellenza 2
├── Avanzato 2
└── Avanzato 3
```

I livelli principali, come:

- Base;
- Intermedio;
- Avanzato;

avranno esclusivamente una funzione organizzativa e non saranno considerati gruppi effettivi.

Questi elementi fungeranno da categorie o contenitori all’interno dei quali saranno organizzati i gruppi reali.

Saranno invece considerati gruppi effettivi elementi come:

- Avanzato 1;
- Avanzato 2;
- Avanzato 3;
- Eccellenza 1;
- Eccellenza 2.

Un gruppo effettivo potrà quindi contenere ulteriori sottogruppi.

## 4. Barra dei filtri

Sopra al calendario e alla colonna laterale sarà presente una barra dedicata alla selezione dei gruppi.

La selezione avverrà attraverso una serie di menu progressivi, nei quali ogni scelta determinerà i valori disponibili nel livello successivo.

Ad esempio:

```text
Avanzato → Avanzato 1 → Eccellenza 1
```

L’utente potrà interrompere la selezione a qualsiasi livello.

La selezione di un elemento padre comporterà automaticamente la visualizzazione dei contenuti appartenenti a tutti i gruppi e sottogruppi inclusi al suo interno.

Ad esempio:

- selezionando `Avanzato`, saranno mostrati i contenuti di tutti i gruppi appartenenti alla categoria Avanzato;
- selezionando `Avanzato 1`, saranno mostrati i contenuti di Avanzato 1 e dei suoi eventuali sottogruppi;
- selezionando `Eccellenza 1`, saranno mostrati esclusivamente i contenuti relativi a Eccellenza 1.

Dovrà inoltre essere possibile rimuovere i filtri e tornare rapidamente alla vista generale.

## 5. Vista generale

Al primo accesso, quando non è stato selezionato alcun filtro, la piattaforma mostrerà la vista generale.

In questa modalità il calendario conterrà tutti i lavori programmati per tutti i gruppi appartenenti ai settori accessibili all’utente.

La vista generale permetterà quindi di avere una panoramica completa dell’attività della società o del settore di competenza.

Nella vista generale:

- saranno mostrati i lavori di tutti i gruppi;
- saranno mostrati i promemoria rilevanti per l’utente;
- non sarà mostrata la card degli obiettivi, poiché gli obiettivi saranno consultabili solo dopo aver selezionato un gruppo o una categoria di gruppi.

## 6. Calendario

Il calendario rappresenterà l’elemento principale della pagina e dovrà occupare la maggior parte dello spazio disponibile.

La visualizzazione iniziale sarà mensile.

Il calendario dovrà mostrare:

- i lavori programmati;
- le attività calendarizzate;
- i promemoria che possiedono una data di scadenza.

Ogni elemento dovrà essere visivamente riconoscibile e dovrà indicare almeno:

- il titolo;
- la tipologia;
- il gruppo di appartenenza;
- la data o l’orario previsto.

I contenuti del calendario verranno aggiornati automaticamente quando l’utente selezionerà un filtro.

## 7. Comportamento del calendario con i filtri

Quando non è selezionato alcun gruppo, il calendario mostrerà i lavori di tutti i gruppi accessibili.

Quando viene selezionata una categoria o un gruppo, il calendario mostrerà solamente i contenuti appartenenti:

- al gruppo selezionato;
- agli eventuali sottogruppi inclusi al suo interno.

Ad esempio, selezionando `Avanzato 1`, il calendario mostrerà:

- i lavori associati direttamente ad Avanzato 1;
- i lavori di Eccellenza 1;
- i lavori di Eccellenza 2;
- i lavori degli eventuali ulteriori sottogruppi di Avanzato 1.

Il filtro dovrà essere applicato anche ai promemoria associati ai gruppi visualizzati.

## 8. Colonna laterale

Alla destra del calendario sarà presente una colonna composta da due card:

1. card dei promemoria;
2. card degli obiettivi.

La card dei promemoria sarà sempre disponibile.

La card degli obiettivi verrà invece mostrata solamente quando l’utente avrà selezionato un gruppo o una categoria dalla barra dei filtri.

## 9. Card dei promemoria

La card dei promemoria permetterà di visualizzare e gestire le attività con scadenza.

Ogni utente potrà:

- creare un nuovo promemoria;
- assegnarlo a se stesso;
- assegnarlo a uno o più altri utenti;
- associarlo eventualmente a un gruppo;
- definire una data di scadenza;
- modificarne lo stato;
- indicarlo come completato.

Un promemoria assegnato a più persone dovrà essere visibile a tutti gli utenti coinvolti.

I promemoria con una scadenza dovranno essere visualizzati sia nella card laterale sia all’interno del calendario.

Quando viene applicato un filtro di gruppo, la card dovrà mostrare i promemoria pertinenti al gruppo selezionato e ai suoi sottogruppi, oltre agli eventuali promemoria personali che devono restare visibili all’utente.

La visibilità dei promemoria seguirà queste regole:

- un promemoria senza gruppo sarà considerato generale/personale e sarà visibile solamente al creatore e agli utenti assegnati;
- un promemoria associato a un gruppo sarà visibile, quando il gruppo rientra nella vista corrente, al creatore, agli assegnatari e a tutti gli utenti che hanno accesso al relativo settore;
- i filtri di gruppo non nasconderanno i promemoria personali senza gruppo che sono visibili all’utente corrente;
- nella card laterale avranno priorità i promemoria assegnati all’utente corrente;
- gli utenti potranno modificare i promemoria visibili secondo le autorizzazioni del settore; per i promemoria personali senza gruppo, la modifica sarà limitata al creatore e agli assegnatari.

## 10. Card degli obiettivi

Sotto alla card dei promemoria sarà presente una card dedicata agli obiettivi.

La card degli obiettivi non verrà mostrata nella vista generale.

Sarà invece visualizzata quando l’utente selezionerà una categoria o un gruppo dalla barra dei filtri.

La card dovrà mostrare gli obiettivi associati:

- al gruppo selezionato;
- agli eventuali sottogruppi compresi nel filtro.

Ad esempio, selezionando `Avanzato 1`, la card mostrerà:

- gli obiettivi direttamente associati ad Avanzato 1;
- gli obiettivi di Eccellenza 1;
- gli obiettivi di Eccellenza 2;
- gli obiettivi degli eventuali ulteriori sottogruppi.

Ogni obiettivo dovrà indicare chiaramente il gruppo al quale appartiene, in modo da distinguere gli obiettivi dei diversi sottogruppi.

Per ogni obiettivo dovrà essere possibile visualizzare almeno:

- il titolo;
- la descrizione;
- il gruppo di appartenenza;
- il periodo di riferimento;
- lo stato di avanzamento;
- l’eventuale data prevista per il raggiungimento.

Gli utenti potranno creare, modificare, aggiornare ed eliminare gli obiettivi dei gruppi ai quali hanno accesso.

## 11. Gestione dei gruppi

Nella parte destra della barra dei filtri sarà presente un pulsante dedicato alla gestione della struttura dei gruppi.

Il pulsante aprirà una finestra contenente una visualizzazione ad albero.

Da questa finestra sarà possibile:

- creare una categoria principale;
- creare un gruppo;
- aggiungere un sottogruppo;
- modificare il nome di un elemento;
- spostare un gruppo all’interno della struttura;
- riordinare gli elementi;
- archiviare un gruppo;
- eliminare un elemento, quando consentito.

La piattaforma dovrà distinguere chiaramente tra:

- categorie organizzative, come Base, Intermedio e Avanzato;
- gruppi effettivi, ai quali possono essere associati lavori, promemoria e obiettivi.

Le categorie organizzative non dovranno contenere direttamente lavori o obiettivi, ma serviranno esclusivamente a raggruppare i gruppi sottostanti.

## 12. Regole di visualizzazione

Il comportamento complessivo della pagina dovrà seguire queste regole:

### Nessun filtro selezionato

- calendario con i lavori di tutti i gruppi;
- promemoria visibili nella colonna laterale;
- card degli obiettivi non visibile.

### Categoria organizzativa selezionata

- calendario filtrato su tutti i gruppi contenuti nella categoria;
- promemoria filtrati sui gruppi contenuti;
- obiettivi di tutti i gruppi e sottogruppi contenuti.

### Gruppo selezionato

- calendario con i lavori del gruppo e dei suoi sottogruppi;
- promemoria associati al gruppo e ai suoi sottogruppi;
- obiettivi del gruppo e dei suoi sottogruppi.

### Sottogruppo finale selezionato

- calendario con i soli contenuti del sottogruppo;
- promemoria associati al sottogruppo;
- obiettivi associati al sottogruppo.

## 13. Risultato atteso

La pagina principale dovrà permettere all’utente di passare rapidamente:

- da una visione generale di tutti i lavori;
- alla programmazione di una categoria;
- alla gestione dettagliata di un singolo gruppo;
- alla consultazione degli obiettivi dei relativi sottogruppi.

L’interfaccia dovrà mantenere sempre la stessa struttura, aggiornando calendario, promemoria e obiettivi in base al livello selezionato.
