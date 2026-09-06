# Kinz MCP sidecar (local, read-only)

This folder is a **separate Node process** for Cursor/Claude. It is not part of the live FastAPI/Nginx deploy. Pushing this branch does **not** update [kinz-teach.cloud](https://kinz-teach.cloud/) — only `main` deploys.

Default API target: `http://127.0.0.1:8000`. Production is refused unless you set `KINZ_ALLOW_PRODUCTION=true`.

## Tools

| Tool | API | Who can call it |
|------|-----|-----------------|
| `kinz_health` | `GET /api/health` | anyone |
| `kinz_whoami` | `GET /api/auth/me` | signed-in |
| `kinz_list_sessions` | `GET /api/sessions` | teacher, operations, manager |
| `kinz_hours_summary` | `GET /api/hours/summary` | operations, manager |
| `kinz_list_students` | `GET /api/students` | teacher, manager |
| `kinz_list_payments` | `GET /api/payments` | teacher, manager |
| `kinz_list_prize_requests` | `GET /api/prize-requests` | teacher, manager |

There are no create/update/delete tools.

## Run locally

1. Start the Kinz API on port 8000 (from `english-tutor-react/backend`, or docker compose).
2. Install this sidecar once:

```bash
cd english-tutor-react/mcp
npm install
npm test
```

3. Copy the Cursor example and keep secrets out of git:

```bash
cp mcp.json.example ../../.cursor/mcp.json
```

Edit `KINZ_EMAIL` / `KINZ_PASSWORD` for **local demo** users only (`ops@lesson-sheets.app` or `manager@lesson-sheets.app`, password `changeme` when `SEED_DEMO_USERS=true`).

4. Restart Cursor MCP so `kinz-mcp-server` appears, then ask: “Call kinz_health”.

## Environment

| Variable | Meaning |
|----------|---------|
| `KINZ_API_URL` | Default `http://127.0.0.1:8000` |
| `KINZ_EMAIL` / `KINZ_PASSWORD` | Login (or use `KINZ_TOKEN`) |
| `KINZ_ALLOW_REMOTE` | Required for a non-localhost staging URL |
| `KINZ_ALLOW_PRODUCTION` | Required to call `kinz-teach.cloud` (still read-only) |

Do not point this at production while you are experimenting.
