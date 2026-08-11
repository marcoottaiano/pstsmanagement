# PSTS Management

Piattaforma web per organizzare il lavoro annuale dei settori di Ginnastica Artistica e Ginnastica Ritmica.

## Requisiti

- Node.js 22 o successivo;
- npm 11 o successivo;
- un progetto Supabase;
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

## Documentazione

- `requirements.md`: requisiti funzionali;
- `technical_requirements.md`: architettura, sicurezza, roadmap e Definition of Done.
