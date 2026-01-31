import { NextResponse } from "next/server";
import { getCachedProbe, type CheckCategory } from "@/lib/probe";
import { APP_NAME, APP_VERSION } from "@/lib/version";

export const runtime = "nodejs";
export const revalidate = 300;

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function renderBadge(label: string, message: string, color: string) {
  // Simple, dependency-free SVG badge (GitHub-ish)
  const leftText = escapeXml(label);
  const rightText = escapeXml(message);

  // Rough text width estimation (good enough for our short strings)
  const charW = 6.5;
  const leftW = Math.max(40, Math.round(leftText.length * charW + 18));
  const rightW = Math.max(40, Math.round(rightText.length * charW + 18));
  const w = leftW + rightW;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${leftText}: ${rightText}">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${w}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${leftW}" height="20" fill="#555"/>
    <rect x="${leftW}" width="${rightW}" height="20" fill="${color}"/>
    <rect width="${w}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${leftW / 2}" y="14">${leftText}</text>
    <text x="${leftW + rightW / 2}" y="14">${rightText}</text>
  </g>
</svg>`;
}

function coerceCategory(x: string | null): CheckCategory | null {
  if (!x) return null;
  if (x === "site" || x === "api" || x === "docs" || x === "auth") return x;
  return null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  // Optional filters:
  // - ?name=<probe name> (exact match)
  // - ?category=site|api|docs|auth
  const name = url.searchParams.get("name");
  const category = coerceCategory(url.searchParams.get("category"));

  const data = await getCachedProbe(
    `${APP_NAME}/${APP_VERSION} (+https://github.com/officialpm/moltbookdowndetector)`
  );

  const results = (data.results || []).filter((r) => {
    if (category && r.category !== category) return false;
    if (name && r.name !== name) return false;
    return true;
  });

  // Default = overall status
  let label = "moltbook";
  let message = data.ok ? "operational" : "degraded";
  let color = data.ok ? "#22c55e" : "#ef4444";

  if (category) {
    label = category;
    const ok = results.length ? results.every((r) => r.ok) : false;
    message = results.length ? (ok ? "ok" : "fail") : "unknown";
    color = message === "ok" ? "#22c55e" : message === "fail" ? "#ef4444" : "#6b7280";
  }

  if (name) {
    label = name;
    const r = results[0];

    if (!r) {
      message = "unknown";
      color = "#6b7280";
    } else if (!r.ok) {
      message = "fail";
      color = "#ef4444";
    } else if (r.ms >= 2500) {
      message = "slow";
      color = "#f59e0b";
    } else {
      message = "ok";
      color = "#22c55e";
    }
  }

  const svg = renderBadge(label, message, color);

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
