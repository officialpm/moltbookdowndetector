# moltbookmdowndetector Changelog

## 0.2.38 — 2026-02-01

- Eliminate skill version drift: add a `prebuild` step that automatically syncs `public/skill.md` frontmatter `version:` to the current `package.json` version.

## 0.2.37 — 2026-02-01

- Add scoped dashboard JSON: `/api/status` now supports `?category=...` and `?name=...` to fetch endpoint/category-specific status payloads (returns 404 when the scope matches no probes).

## 0.2.36 — 2026-01-31

- Add `/api/health` endpoint for uptime monitors/agents that prefer status codes:
  - Returns HTTP 200 when OK and HTTP 503 when BACKOFF.
  - Supports `?category=...` / `?name=...` scoping and `?format=json`.
  - Documented in OpenAPI + skill.md.

## 0.2.35 — 2026-01-31

- Make endpoint cards deep-linkable + more informative:
  - Clicking an endpoint card now focuses that endpoint and updates the URL with `?endpoint=...` (shareable).
  - Endpoint cards now show p95 latency and timeout rate from your local history (not just avg).

## 0.2.34 — 2026-01-31

- Add shareable deep links for debugging reliability:
  - Endpoint stats table now syncs filters to URL query params (category/q/sort/issues).
  - Clicking an endpoint name deep-links into the “Recent Checks” endpoint view via `?endpoint=...`.

## 0.2.33 — 2026-01-31

- Fix authenticated probe semantics: `/api/check` now treats 401/403 as failures for auth-required endpoints (surfaces missing/invalid `MOLTBOOK_API_KEY` instead of reporting a false-positive OK).
- Sync `public/skill.md` version with package version.

## 0.2.32 — 2026-01-31

- Add category-level reliability breakdown on the dashboard (site/api/docs/auth) by persisting endpoint category in local probe history.

## 0.2.31 — 2026-01-31

- Expand `/api/openapi` to be actually useful to agents/tools: add operation tags, richer component schemas (agent-check/status/probe), and concrete response examples (JSON + text/markdown).

## 0.2.30 — 2026-01-31

- Add a one-click “Copy incident” button that generates a paste-ready Markdown incident summary from your latest probe + local history (useful for sharing in chats, filing issues, or grounding agents).

## 0.2.29 — 2026-01-31

- Persist richer per-endpoint history in the browser (status code + error string), so local reliability views can distinguish timeouts vs other failures.
- Improve the dashboard UI:
  - Recent Checks: add Timeout% alongside failure rate/latency.
  - Endpoint stats table: add Timeout% and "Last err" columns.

## 0.2.28 — 2026-01-31

- Add `/api/openapi` (OpenAPI 3.0 JSON) so agents/tools can discover and integrate with the API surface without reading docs.
- Expose the new OpenAPI link in the Agent Integration UI and document it in `public/skill.md`.

## 0.2.27 — 2026-01-31

- Make Agent Integration URLs environment-aware: the UI now infers the current site origin (instead of hardcoding production), so preview/local deployments copy the correct `/api/*` + `/skill.md` links.

## 0.2.26 — 2026-01-31

- Add timeout-specific counts to status APIs so dashboards/agents can distinguish timeouts from other failures:
  - `/api/status`: `totals.totalTimeouts` + `byCategory[*].timeouts`
  - `/api/agent-check`: `totalTimeouts` + `byCategory[*].timeouts` (and expose in text/markdown formats)
  - `/api/agent-check/schema`: update schema + example

## 0.2.25 — 2026-01-31

- Add `/api/status`, a dashboard-friendly status JSON endpoint (overall + per-category totals + full per-endpoint results).
- Link to `/api/status` from the homepage nav and document it in `public/skill.md`.

## 0.2.24 — 2026-01-31

- Add `authEnabled` + `authProbesIncluded` to `/api/check` and `/api/agent-check`, and surface a UI warning when authenticated probes are disabled (no `MOLTBOOK_API_KEY`).

## 0.2.23 — 2026-01-31

- Add an OpenClaw-focused integration snippet to `/api/agent-context` (and surface it in the Agent Integration UI) so agents can copy/paste a HEARTBEAT.md-ready check line.

## 0.2.22 — 2026-01-31

- Add best-effort `probeRegion` to `/api/check`, `/api/agent-check`, and `/api/agent-context` so you can spot region-specific outages (and display it in the UI footer).

## 0.2.21 — 2026-01-31

- Add `/api/agent-check/schema` (JSON Schema) so tools/agents can integrate with `/api/agent-check` without guessing the response shape.

## 0.2.20 — 2026-01-31

- Enrich `/api/agent-check` with summary fields (`totalProbes`, `totalFailures`, `totalDegraded`, `degradedThresholdMs`) plus a `byCategory` breakdown so agents can make quick backoff decisions without iterating arrays.

## 0.2.19 — 2026-01-31

- Add a failure-rate + latency stats strip to “Recent Checks” (Overall or per-endpoint), showing failure rate, avg latency, and p95 based on your stored history.

## 0.2.18 — 2026-01-31

- Add issue-focused controls to the local Endpoint stats table: category filter, endpoint search, and an “Only issues” toggle to quickly isolate flaky surfaces.

## 0.2.17 — 2026-01-31

- Add an endpoint stats table (failure rate + p95/avg latency + last OK/fail) derived from local browser history so you can quickly spot flaky or slow surfaces.

## 0.2.16 — 2026-01-31

- Add a new “Recent Incidents” section that groups contiguous degraded checks into incident windows with approximate duration and most-impacted endpoints (derived from local browser history).

## 0.2.15 — 2026-01-31

- Add paste-friendly output formats to `/api/agent-check` via `?format=text|markdown` (default JSON), making it easier for agents/humans to log actionable status without JSON parsing.
- Update Agent Integration UI snippet to include the new text-mode check.

## 0.2.14 — 2026-01-31

- Add `/api/agent-context` endpoint that returns a paste-ready, agent-readable status summary (Markdown by default, JSON via `?format=json`) so agents can log/ground decisions without custom parsing.
- Update Agent Integration UI + `public/skill.md` to document and expose the new context endpoint.

## 0.2.13 — 2026-01-31

- Add an Export Diagnostics button that downloads (or copies) a JSON bundle containing the latest probe result + local history, so you can attach it to bug reports or share with agents.

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
