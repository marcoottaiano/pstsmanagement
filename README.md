# PSTS Management

Piattaforma web per organizzare il lavoro annuale dei settori di Ginnastica Artistica e Ginnastica Ritmica.

## Requisiti

- Node.js 22 o successivo;
- npm 11 o successivo;
- accesso al progetto Supabase ufficiale collegato;
- un progetto Vercel per preview e produzione.

## Configurazione locale

1. Installa le dipendenze:

   ```bash
   npm install
   ```

2. Copia `.env.example` in `.env.local` e inserisci le chiavi pubbliche del progetto Supabase:

   ```bash
   cp .env.example .env.local
   ```

3. Avvia l'applicazione:

   ```bash
   npm run dev
   ```

## Validazione

Esegui l'intera pipeline locale con:

```bash
npm run validate
```

Il comando verifica formatter, lint, TypeScript, test e build di produzione.

## Database

Sviluppo locale, preview Vercel e produzione condividono l'unico progetto Supabase ufficiale. Ogni modifica allo schema deve essere aggiunta come migrazione versionata in `supabase/migrations`; non modificare lo schema dal Table Editor.

Prima controlla la migrazione senza applicarla:

```bash
npm run db:push:dry-run
```

Poi applicala una sola volta al progetto collegato e rigenera i tipi TypeScript:

```bash
npm run db:push
npm run db:types
```

Non eseguire reset sul progetto collegato e non caricare seed dimostrativi. Gli utenti vengono creati manualmente dal pannello Supabase.

## Documentazione

- `requirements.md`: requisiti funzionali;
- `technical_requirements.md`: architettura, sicurezza, roadmap e Definition of Done.
