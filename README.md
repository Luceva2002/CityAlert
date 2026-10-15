# CityAlert

La mappa civica del tuo comune. I cittadini segnalano in tempo reale i problemi più frequenti in città — fontanella guasta, buca, erba alta, lampione spento, incendi — e tutta la comunità li vede comparire sulla mappa.

PWA mobile-first e responsive fino a desktop, con tema chiaro "Liquid Civic": vetro liquido in stile iOS, mappa 3D diurna e oro segnale come accento.

## Stack

- **Next.js 15** (App Router, Turbopack) + React 19 + TypeScript
- **Tailwind CSS v4** con design token custom (vetro liquido + oro)
- **Supabase** — auth, Postgres con RLS, Storage foto, Realtime per le segnalazioni live
- **Mapbox GL** (`react-map-gl`) — stile Standard 3D con preset giorno
- **Motion** per le animazioni

## Funzionalità

- Autenticazione email/password (Supabase Auth), cambio password e username
- Mappa 3D con posizione GPS live e pin a goccia nel colore categoria; i pin
  sovrapposti si aprono a ventaglio e restano tutti cliccabili
- Layout mobile-first che si adatta a tablet e desktop (sheet che diventano modali centrate, griglie fluide)
- Nuove segnalazioni push in tempo reale (Supabase Realtime)
- Wizard di segnalazione: categoria → foto (fotocamera o galleria) → descrizione
- 10 categorie comunali: buca, fontanella, erba alta, incendio, lampione, rifiuti, marciapiede, perdita d'acqua, vandalismo, altro
- Stato segnalazione: aperta / in lavorazione / risolta
- Validazione comunitaria: like/dislike e commenti su ogni segnalazione
- Gamification: +20 XP e +5 monete a segnalazione (max 5 premiate al giorno), livelli con barra progresso
- Profilo con statistiche e card delle proprie segnalazioni
- Pagine termini, privacy e assistenza
- i18n italiano/inglese

## Setup

1. Installa le dipendenze:

```bash
npm install
```

2. Crea `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
NEXT_PUBLIC_MAPBOX_TOKEN=<mapbox-public-token>
```

3. Esegui `supabase/schema.sql` nel SQL Editor del progetto Supabase (idempotente: crea tabelle, RLS, funzione reward `award_report`, bucket storage e publication realtime).

4. Avvia:

```bash
npm run dev
```

## Struttura

```
app/
  (auth)/auth          → splash + login/registrazione
  (app)/               → mappa (home), profilo, account
  (info)/              → termini, privacy, assistenza (pubbliche)
  api/civic            → report (POST + reward), reports (GET, ?scope=mine),
                         report/[id]/vote, report/[id]/comments, upload foto
  api/profile          → GET profilo, PATCH username
components/
  ui/                  → primitive (PillButton, GlassIconButton, CloseButton, RingAvatar)
  map/                 → ReportPin, LiveBadge, RecentReportsPanel
  report/              → ReportCard, ReportSheet, ReportDetailSheet, VoteBar,
                         CommentsSection, CategoryCarousel, ReportMapThumbnail
  *.tsx                → schermate (MapScreen, ProfileScreen, AccountScreen, AuthScreen)
lib/                   → supabase, geolocalizzazione, realtime, i18n, map-utils, validazione
messages/              → it.json / en.json
supabase/schema.sql    → schema completo (tabelle, vista feed, RLS, storage)
types/civic.ts         → categorie, status, social, gamification
```

## Script

- `npm run dev` — sviluppo (Turbopack)
- `npm run build` — build di produzione
- `npm run typecheck` — controllo TypeScript
- `npm run lint` — ESLint
