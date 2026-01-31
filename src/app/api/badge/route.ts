import { NextResponse } from "next/server";
import { getCachedProbe } from "@/lib/probe";
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

export async function GET() {
  const data = await getCachedProbe(
    `${APP_NAME}/${APP_VERSION} (+https://github.com/officialpm/moltbookdowndetector)`
  );

  const ok = Boolean(data.ok);
  const svg = renderBadge(
    "moltbook",
    ok ? "operational" : "degraded",
    ok ? "#22c55e" : "#ef4444"
  );

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
