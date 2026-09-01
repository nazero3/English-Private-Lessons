# Self-hosted deployment (DigitalOcean VPS)

Run the full stack — **React**, **FastAPI**, **PostgreSQL** — on one server with Docker Compose. No Supabase subscription required.

## Architecture

```text
Internet → Nginx (:80) or Caddy (:443) → Nginx → React + /api → FastAPI → Postgres
```

| Mode | When | Ports |
|------|------|-------|
| **IP-only** | Testing before domain | `docker compose up` — HTTP on :80 |
| **Production** | Domain + HTTPS | `docker compose -f docker-compose.yml -f docker-compose.prod.yml up` — Caddy on :80/:443 |

## One-command deploy (on the server)

```bash
git clone https://github.com/nazero3/English-Private-Lessons.git
cd English-Private-Lessons/english-tutor-react

# First time only
sudo bash scripts/deploy/bootstrap-server.sh   # Docker + firewall
bash scripts/deploy/setup-env.sh               # Creates .env with secrets
bash scripts/deploy/deploy.sh                  # Build and start

# Verify
bash scripts/deploy/verify.sh                  # localhost
bash scripts/deploy/verify.sh YOUR_SERVER_IP   # from your laptop
```

## Phase 1 — Create a VPS

**Option A — DigitalOcean UI**

1. [Create droplet](https://cloud.digitalocean.com/droplets/new): Ubuntu 24.04, Basic 1 GB ($6/mo), region near you.
2. Add your SSH key.
3. Note the **public IPv4** address.

**Option B — doctl script**

```bash
doctl auth init   # API token from cloud.digitalocean.com/account/api/tokens
bash scripts/deploy/create-droplet.sh lesson-sheets
```

## Phase 2 — Bootstrap the server

```bash
ssh root@YOUR_SERVER_IP
git clone https://github.com/nazero3/English-Private-Lessons.git
cd English-Private-Lessons/english-tutor-react
sudo bash scripts/deploy/bootstrap-server.sh
```

## Phase 3 — Configure secrets

```bash
bash scripts/deploy/setup-env.sh
```

Edit `.env` before sharing with teachers:

| Variable | Production value |
|----------|------------------|
| `JWT_SECRET` | Auto-generated — keep secret |
| `POSTGRES_PASSWORD` | Auto-generated — keep secret |
| `SEED_DEMO_USERS` | `false` after first login |
| `CORS_ORIGINS` | `https://your-domain.com` (or `http://YOUR_IP` for IP-only) |

## Phase 4 — Deploy (IP-only, HTTP)

```bash
bash scripts/deploy/deploy.sh
bash scripts/deploy/verify.sh YOUR_SERVER_IP
```

Open `http://YOUR_SERVER_IP` in a browser.

Demo logins (change passwords immediately):

| Role | Email | Password |
|------|-------|----------|
| Manager | manager@lesson-sheets.app | changeme |
| Teacher | teacher@lesson-sheets.app | changeme |

## Phase 5 — Domain + HTTPS

### Buy a domain (Namecheap, Cloudflare, Porkbun)

1. Buy e.g. `kinz-lessons.com` (~$12/year).
2. In DNS, add an **A record**:
   - **Host:** `@` (root) or `lessons` (subdomain)
   - **Value:** your droplet public IP
   - **TTL:** 300–3600
3. Wait for DNS (usually 5–60 minutes). Check: `dig +short lessons.yourdomain.com`

### Enable HTTPS with Caddy

Edit `.env`:

```env
DOMAIN=lessons.yourdomain.com
ACME_EMAIL=you@example.com
CORS_ORIGINS=https://lessons.yourdomain.com
SEED_DEMO_USERS=false
```

Redeploy:

```bash
bash scripts/deploy/deploy.sh
```

Caddy obtains a free Let's Encrypt certificate automatically.

Install on phones only works over HTTPS (or localhost). After this step, teachers can open the site on their phone and tap **Install** / **Add to Home Screen**.

### Custom subdomains (e.g. `kinz.service.teacher.edu`)

You can only use a subdomain if **you control the parent domain**. `.edu` domains belong to accredited institutions — ask school IT to create a DNS A record for you.

## Phase 6 — Hardening

```bash
# Weekly DB backups (Sundays 03:15)
bash scripts/deploy/install-backup-cron.sh

# Manual backup anytime
bash scripts/deploy/backup-db.sh
```

- Change all demo passwords via the manager dashboard.
- Set `SEED_DEMO_USERS=false` in `.env`, then `bash scripts/deploy/deploy.sh`.
- Optional: enable DigitalOcean droplet snapshots ($1–2/mo).

## Local development (without Docker)

**Terminal 1 — Postgres**

```bash
docker run -d --name lessons-db -e POSTGRES_USER=lessons -e POSTGRES_PASSWORD=lessons \
  -e POSTGRES_DB=lessons -p 5433:5432 postgres:16-alpine
```

**Terminal 2 — API**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql://lessons:lessons@localhost:5433/lessons
export JWT_SECRET=dev-secret-change-in-production
uvicorn app.main:app --reload --port 8000
```

**Terminal 3 — Frontend**

```bash
cp .env.example .env.local
npm install && npm run dev
```

Open http://localhost:5173

## Environment variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `JWT_SECRET` | `.env` | Sign login tokens — **must** change in production |
| `POSTGRES_PASSWORD` | `.env` | Database password |
| `DOMAIN` | `.env` | Enables Caddy HTTPS when set |
| `ACME_EMAIL` | `.env` | Let's Encrypt registration email |
| `CORS_ORIGINS` | `.env` | Allowed browser origins for API |
| `SEED_DEMO_USERS` | `.env` | Set `false` after first deploy |
| `VITE_API_URL` | build-time | Leave empty for same-origin `/api` (default in Docker) |

## Files

| Path | Role |
|------|------|
| `docker-compose.yml` | Base stack (HTTP / IP-only) |
| `docker-compose.prod.yml` | Caddy HTTPS overlay |
| `Caddyfile` | Auto-TLS reverse proxy |
| `scripts/deploy/` | Bootstrap, deploy, backup, verify, CI remote-update |
| `backend/` | FastAPI app |
| `nginx/nginx.conf` | Static files + API reverse proxy |
| `public/books/` | Course PDFs, bind-mounted into Nginx (not stored in the image) |

## Continuous deploy (GitHub Actions)

A push to `main` (or **Actions → CI / CD → Run workflow**) builds the frontend, then SSHs into the VPS, runs `git pull`, and `bash scripts/deploy/deploy.sh`. `.env` on the server is never overwritten.

You still commit and push from your laptop. You do not SSH for routine deploys.

### 1. Deploy key on the VPS

On your laptop (do not reuse your personal SSH key):

```bash
ssh-keygen -t ed25519 -C "github-actions-kinz" -f github-deploy -N ""
```

Copy the **public** key onto the VPS (same user that can run Docker, usually the account you SSH in with today):

```bash
ssh YOUR_USER@YOUR_VPS 'mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys' < github-deploy.pub
```

Confirm that user can deploy:

```bash
ssh -i github-deploy YOUR_USER@YOUR_VPS 'docker info >/dev/null && echo docker_ok'
```

If that fails: `sudo usermod -aG docker YOUR_USER`, then log out and back in.

### 2. GitHub secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Example | Meaning |
|--------|---------|---------|
| `VPS_HOST` | `kinz-teach.cloud` or the droplet IP | SSH hostname |
| `VPS_USER` | `root` or `deploy` | SSH user (must be in the `docker` group) |
| `VPS_SSH_KEY` | contents of `github-deploy` (the **private** file) | Full PEM, including `BEGIN` / `END` lines |
| `VPS_APP_DIR` | `/root/English-Private-Lessons` | Directory you `git clone`d into (the folder that contains `english-tutor-react/`) |
| `VPS_PORT` | `22` | Optional. Only if SSH is not on port 22 |

Optional **variable** (not a secret): `VERIFY_URL` = `https://kinz-teach.cloud`. If unset, the workflow uses that URL after deploy.

Paste the private key, then delete `github-deploy` from the laptop (or store it in a password manager). Never commit it.

### 3. First pipeline

Push this workflow to `main`, or on GitHub: **Actions → CI / CD → Run workflow**.

Watch the **Deploy to VPS** job. A red job named “Require deploy secrets” means the secrets above are missing.

### 4. If git pull fails on the server

The pipeline uses `git pull --ff-only`. Local edits on the VPS will block it. Either commit those changes elsewhere or, on the VPS:

```bash
cd /path/to/English-Private-Lessons
git status
git stash   # only if you intend to throw away server-only edits
```

Then re-run the workflow.

Manual update (same as CI, without GitHub):

```bash
cd english-tutor-react
bash scripts/deploy/remote-update.sh
```

## Cost estimate

| Item | Cost |
|------|------|
| VPS (1 GB) | ~$6/month |
| Domain (.com) | ~$12/year |
| HTTPS (Let's Encrypt) | Free |
| **Total** | ~$7/month |
