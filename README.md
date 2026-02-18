# AI Control Notebook

Mobile-first, notebook-style personal AI/automation control tower.

## Stack
- Next.js App Router + TypeScript
- Tailwind CSS + Framer Motion
- Supabase (Postgres/Auth)
- AES-256-GCM vault encryption (server-only)

## Environment Variables
Create `.env.local`:

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MASTER_KEY= # base64 string for exactly 32 bytes
OPENAI_API_KEY= # optional; llm_call mocks when absent
DEMO_OWNER_ID=00000000-0000-0000-0000-000000000001
APP_BASE_URL=http://localhost:3000
```

Generate `MASTER_KEY`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Setup

```bash
npm install
npm run dev
```

## Supabase SQL
- Schema + RLS: `supabase/schema.sql`
- Seed: `supabase/seed.sql`

Run schema first, then seed.

## MVP Coverage
- **Home**: monthly spend, renewals timeline(D-7/D-14), runs today, favorites, system notes, recent activity, and connection snapshot.
- **Launch**: search + filter chips + run sheet modal + result viewer + save result as note.
- **Subscriptions**: summary, sorting, card list, status toggle, add/edit/detail + synced rows snapshot.
- **Vault**: encrypted key CRUD, rotate, disable, metadata-only display(last4) + active/disabled snapshot.
- **Logs**: filters, detail JSON copy, mini insights(most-used/fail-rate) + run health strip.
- **Settings**: profile/theme/export(in-app JSON/CSV)/integration notes.
- **PWA basics**: manifest + service worker registration.

## Security
- API keys are never exposed to client.
- Encryption/decryption only in server routes via `lib/crypto.ts`.
- DB stores `encrypted_key`, `iv`, `tag`, `last4` (+ `is_active`), with owner-based RLS.


## Export API
- `GET /api/export?format=json` full data export JSON
- `GET /api/export?format=csv` table count snapshot CSV

- `GET /api/health` connection status + table counts for dashboard link checks
