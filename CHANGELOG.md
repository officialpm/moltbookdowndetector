# moltbookmdowndetector Changelog

## 0.2.12 — 2026-01-31

- Add endpoint filters (category chips + search) so you can focus on specific Moltbook surfaces.
- Persist filters in the URL (`?category=` / `?q=`) for shareable, agent-friendly deep links.

## 0.2.11 — 2026-01-31

- Re-add `/api/agent-check/schema` so agents/tools can integrate without guessing response shape.
- Include an inline example response and scope/query documentation in the schema payload.

## 0.2.10 — 2026-01-31

- Add an endpoint drilldown to “Recent Checks” so you can view failures/latency over time for a specific Moltbook surface (not just overall).

## 0.2.9 — 2026-01-31

- Restore `/api/agent-check/schema` (JSON schema) so tools/agents can integrate without guessing response shape.
- Include `scope` + scoped check behavior in the schema to match `?category=` / `?name=`.

## 0.2.8 — 2026-01-31

- Add scoped agent checks to `/api/agent-check` via `?category=` and/or `?name=` so agents can backoff only when the specific Moltbook surface they need is degraded.
- Expose scoped check examples in the Agent Integration UI and `public/skill.md`.

## 0.2.7 — 2026-01-31

- Upgrade `/api/badge` to support per-category and per-endpoint badges via query params (`?category=api`, `?name=Posts%20Feed`), so dashboards/agents can monitor specific surfaces.
- Enhance Agent Integration UI + `public/skill.md` to document and expose the new badge options.

## 0.2.6 — 2026-01-31

- Add `/api/metrics` Prometheus endpoint (plaintext) so dashboards/alerts can scrape overall + per-endpoint health/latency.
- Add Metrics link in the header nav.
- Update `public/skill.md` to document the new endpoint.

## 0.2.5 — 2026-01-31

- Add `/api/badge` (SVG) so dashboards/READMEs can embed a cached, always-up-to-date Moltbook status badge.
- Upgrade Agent Integration UI with a copyable Markdown badge snippet + direct badge link.

## 0.2.4 — 2026-01-31

- Add `/api/agent-check/schema` (JSON schema) so agents/tools can reliably integrate without guessing response shape.
- Eliminate version drift by sourcing the `/api/agent-check` User-Agent version from `package.json`.
- Fix Agent Integration UI + `public/skill.md` to correctly describe the `/api/agent-check` response (`failures`/`degraded`).

## 0.2.3 — 2026-01-31

- Add `/api/agent-check`: an agent-friendly status endpoint that returns a single `action` (OK/BACKOFF), recommended backoff time, and lists of failing/degraded endpoints.
- Update onboarding UI + `public/skill.md` to default to the new agent-oriented endpoint.

## 0.2.2 — 2026-01-31

- Add a "Reliability summary" section (flakiest + slowest endpoints) computed from local check history.
- Align `/api/check` User-Agent version string with current release.
- Silence Next.js workspace root warning by pinning `turbopack.root` to this project.

## 0.2.1 — 2026-01-31

- Add per-endpoint reliability stats (recent failure rate + avg latency) computed from local status history.
- Expand stored status history to include endpoint results (up to 120 checks) with best-effort migration.
- Update `public/skill.md` with an OpenClaw-oriented heartbeat integration snippet.

## 0.2.0 — 2026-01-31

- Major UI overhaul with modern design
- Add animated pulsing status indicators with glow effects
- Add visual latency bars showing response time quality (Excellent/Good/Fair/Slow)
- Add status history chart tracking last 24 checks (stored in localStorage)
- Add manual refresh button with loading animation
- Redesign header with gradient text and glowing logo
- Add subtle grid pattern background and radial gradients
- Improve Agent Integration section with 3-step cards and collapsible code snippet
- Add skeleton loading states for endpoint cards
- Add hover effects and smooth transitions throughout
- Add footer with monitoring status indicator
- Improve mobile responsiveness
- Custom scrollbar styling and focus states
- Better color-coded status banners (green for operational, red for degraded)

## 0.1.9 — 2026-01-31

- Improve homepage description copy and spacing between header copy and status card.

## 0.1.8 — 2026-01-31

- Add Moltbook mascot logo to the homepage header.

## 0.1.7 — 2026-01-31

- Improve description copy across metadata and `skill.md`.

## 0.1.6 — 2026-01-31

- Move “Send Your AI Agent…” section to the top, link to the full `skill.md`, and add a one-click copy button for the onboarding text.

## 0.1.5 — 2026-01-31

- Improve site metadata (title/description/OpenGraph/Twitter) and branding.

## 0.1.4 — 2026-01-31

- Cache `/api/check` at the edge for 5 minutes (`s-maxage=300`) to reduce probe traffic; UI auto-refresh slowed to ~60s.

## 0.1.3 — 2026-01-31

- Add `/skill.md` and a homepage callout section so agents can quickly integrate the detector into their heartbeat.

## 0.1.2 — 2026-01-31

- Fix homepage status showing "Unknown" by switching to client-side fetch + auto-refresh every ~20s.

## 0.1.1 — 2026-01-31

- Add optional authenticated probe via `MOLTBOOK_API_KEY` (Vercel env) to detect auth-specific outages.

## 0.1.0 — 2026-01-31

- Initial release: status page + API probe endpoint for Moltbook availability.
