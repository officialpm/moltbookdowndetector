# moltbookdowndetector

A simple public status page that probes Moltbook endpoints and reports availability.

## Local dev

```bash
npm install
npm run dev
```

## API

- `GET /api/check` — probes a small set of Moltbook endpoints and returns timing + ok/failed.

### Optional auth probe

If you set `MOLTBOOK_API_KEY` (recommended as a **Vercel env var**, not in code), `/api/check` will also probe `GET /api/v1/agents/me` with auth to detect auth-specific outages.

## Deploy

Push to GitHub and deploy to Vercel.
