import { NextResponse } from "next/server";
import { APP_NAME, APP_VERSION } from "@/lib/version";

export const runtime = "nodejs";
export const revalidate = 3600;

// JSON schema (Draft 2020-12) for /api/agent-check
// Keeping this server-generated avoids docs drifting from the actual API.
export async function GET(request: Request) {
  const baseUrl = new URL(request.url);
  baseUrl.pathname = "/api/agent-check";
  baseUrl.search = "";

  const schema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: new URL("/api/agent-check/schema", request.url).toString(),
    title: "MoltBookDownDetector Agent Check",
    description:
      "Agent-friendly health summary for Moltbook. Use action/recommendedBackoffMinutes to decide whether to back off writes.",
    type: "object",
    additionalProperties: false,
    required: [
      "ok",
      "checkedAt",
      "action",
      "recommendedBackoffMinutes",
      "failures",
      "degraded",
    ],
    properties: {
      ok: { type: "boolean" },
      checkedAt: {
        type: "string",
        format: "date-time",
        description: "ISO timestamp when probes were executed",
      },
      scope: {
        type: "object",
        additionalProperties: false,
        properties: {
          category: {
            type: "string",
            description:
              "If provided, response is scoped to this category (site|api|docs|auth)",
          },
          name: {
            type: "string",
            description: "If provided, response is scoped to this probe name",
          },
        },
      },
      action: { type: "string", enum: ["OK", "BACKOFF"] },
      recommendedBackoffMinutes: {
        type: "number",
        minimum: 0,
        description:
          "Suggested number of minutes to back off (especially writes) when action=BACKOFF",
      },
      failures: {
        type: "array",
        description: "Endpoints that failed (timeout, 5xx, etc.)",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "category", "status", "ms", "url"],
          properties: {
            name: { type: "string" },
            category: { type: "string" },
            status: {
              type: "number",
              description: "HTTP status (0 means timeout/error)",
            },
            error: { type: "string" },
            ms: { type: "number", minimum: 0 },
            url: { type: "string" },
          },
        },
      },
      degraded: {
        type: "array",
        description: "Endpoints that succeeded but were slow (heuristic)",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "category", "status", "ms", "url"],
          properties: {
            name: { type: "string" },
            category: { type: "string" },
            status: { type: "number" },
            error: { type: "string" },
            ms: { type: "number", minimum: 0 },
            url: { type: "string" },
          },
        },
      },
    },
    examples: [
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        action: "OK",
        recommendedBackoffMinutes: 0,
        failures: [],
        degraded: [],
      },
      {
        ok: false,
        checkedAt: new Date().toISOString(),
        scope: { category: "api" },
        action: "BACKOFF",
        recommendedBackoffMinutes: 20,
        failures: [
          {
            name: "Posts Feed",
            category: "api",
            status: 0,
            error: "timeout",
            ms: 5001,
            url: "https://www.moltbook.com/api/v1/posts?sort=new&limit=1",
          },
        ],
        degraded: [],
      },
    ],
    links: [
      {
        rel: "self",
        href: new URL("/api/agent-check/schema", request.url).toString(),
      },
      { rel: "agent-check", href: baseUrl.toString() },
      {
        rel: "repo",
        href: "https://github.com/officialpm/moltbookdowndetector",
      },
    ],
    meta: {
      generator: `${APP_NAME}/${APP_VERSION}`,
    },
  };

  return NextResponse.json(schema, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300",
    },
  });
}
