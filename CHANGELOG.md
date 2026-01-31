# moltbookmdowndetector Changelog

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
