# Lesson Sheets Platform

Hybrid private-lesson app: **Teacher Brief**, **Worksheet**, **3-lesson Review Quiz**, and **Homework** — printable A4 + on-screen check mode.

## Roles

| Role | Access |
|------|--------|
| **Manager** | All courses, assign teachers, edit lessons, all sessions |
| **Teacher** | Only assigned courses; generate packs; score & save sessions |

Students do not log in (paper-first MVP).

## Quick start

```bash
cd english-tutor-react
npm install
npm run dev
```

## Production setup

### Option A — Self-hosted VPS (recommended, no Supabase bill)

See **[docs/DEPLOY.md](docs/DEPLOY.md)** for the full guide. On a fresh Ubuntu server:

```bash
git clone https://github.com/nazero3/English-Private-Lessons.git
cd English-Private-Lessons/english-tutor-react
sudo bash scripts/deploy/bootstrap-server.sh
bash scripts/deploy/full-server-deploy.sh
bash scripts/deploy/verify.sh YOUR_SERVER_IP
```

For HTTPS after buying a domain, set `DOMAIN`, `ACME_EMAIL`, and `CORS_ORIGINS` in `.env`, then run `bash scripts/deploy/deploy.sh`.

After GitHub secrets are set (see **[docs/DEPLOY.md](docs/DEPLOY.md)** — section *Continuous deploy*), a push to `main` builds the app and deploys on the VPS automatically.

- **Frontend:** React/Vite static build served by Nginx
- **Backend:** FastAPI + JWT auth
- **Database:** PostgreSQL in Docker
- **HTTPS:** Caddy + Let's Encrypt (when `DOMAIN` is set)

Demo logins: `manager@lesson-sheets.app` / `teacher@lesson-sheets.app` — password `changeme` (change before sharing).

### Option B — Supabase (legacy)

1. Create a Supabase project.
2. Run SQL in order:
   - [`supabase/schema.sql`](supabase/schema.sql)
   - `npm run enrich && npm run seed:sql` then [`supabase/seed.sql`](supabase/seed.sql)
   - [`supabase/rpc_get_review_quiz.sql`](supabase/rpc_get_review_quiz.sql)
3. Copy `.env.example` → `.env.local` with Supabase URL and anon key (leave `VITE_API_URL` empty).
4. Promote a manager in SQL after first signup.

Until Supabase or `VITE_API_URL` is configured, the app stores data in the browser (local demo mode).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run enrich` | Rebuild enriched lesson content from `units.js` |
| `npm run seed:sql` | Emit `supabase/seed.sql` |

## Lesson pack

For each unit the teacher gets:

1. Teacher Brief (prep + answer keys)
2. In-lesson Worksheet (student)
3. Review Quiz spanning units N−2…N
4. Homework (student)

Print via browser Print → Save as PDF (A4).

## Security notes

- With Supabase, Row Level Security enforces course visibility.
- Answer keys appear only on Teacher Brief / authenticated check views — not on student worksheet/homework/quiz printouts.
- Never commit `.env.local`.
