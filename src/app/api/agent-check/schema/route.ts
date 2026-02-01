import { NextResponse } from "next/server";
import { APP_NAME, APP_VERSION } from "@/lib/version";

export const runtime = "nodejs";
export const revalidate = 300;

/**
 * JSON Schema for /api/agent-check
 *
 * Why this exists:
 * - lets tools/agents integrate without guessing the response shape
 * - provides stable docs that can be cached (5m)
 */
export async function GET() {
  const base = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "MoltBookDownDetector AgentCheckResponse",
    description: `Schema for ${APP_NAME} /api/agent-check (v${APP_VERSION}).`,
    type: "object",
    additionalProperties: false,
    properties: {
      ok: { type: "boolean" },
      checkedAt: { type: "string", description: "ISO timestamp" },
      scope: {
        type: "object",
        additionalProperties: false,
        properties: {
          category: { type: "string", enum: ["site", "api", "docs", "auth"] },
          name: { type: "string" },
        },
        required: [],
      },

      totalProbes: { type: "integer", minimum: 0 },
      totalFailures: { type: "integer", minimum: 0 },
      totalDegraded: { type: "integer", minimum: 0 },
      degradedThresholdMs: { type: "number", minimum: 0 },

      byCategory: {
        type: "object",
        description: "Summary counts keyed by category.",
        additionalProperties: {
          type: "object",
          additionalProperties: false,
          properties: {
            total: { type: "integer", minimum: 0 },
            failures: { type: "integer", minimum: 0 },
            degraded: { type: "integer", minimum: 0 },
            ok: { type: "boolean" },
          },
          required: ["total", "failures", "degraded", "ok"],
        },
      },

      action: { type: "string", enum: ["OK", "BACKOFF"] },
      recommendedBackoffMinutes: { type: "number", minimum: 0 },

      failures: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            category: { type: "string", enum: ["site", "api", "docs", "auth"] },
            status: { type: "integer", minimum: 0 },
            error: { type: "string" },
            ms: { type: "number", minimum: 0 },
            url: { type: "string" },
          },
          required: ["name", "category", "status", "ms", "url"],
        },
      },

      degraded: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            category: { type: "string", enum: ["site", "api", "docs", "auth"] },
            status: { type: "integer", minimum: 0 },
            error: { type: "string" },
            ms: { type: "number", minimum: 0 },
            url: { type: "string" },
          },
          required: ["name", "category", "status", "ms", "url"],
        },
      },
    },
    required: [
      "ok",
      "checkedAt",
      "totalProbes",
      "totalFailures",
      "totalDegraded",
      "degradedThresholdMs",
      "byCategory",
      "action",
      "recommendedBackoffMinutes",
      "failures",
      "degraded",
    ],
  } as const;

  const example = {
    ok: true,
    checkedAt: new Date().toISOString(),
    totalProbes: 8,
    totalFailures: 0,
    totalDegraded: 1,
    degradedThresholdMs: 2500,
    byCategory: {
      site: { total: 2, failures: 0, degraded: 0, ok: true },
      api: { total: 4, failures: 0, degraded: 1, ok: true },
    },
    action: "OK",
    recommendedBackoffMinutes: 0,
    failures: [],
    degraded: [
      {
        name: "Posts Feed",
        category: "api",
        status: 200,
        ms: 3120,
        url: "https://www.moltbook.com/api/v1/posts",
      },
    ],
  };

  return NextResponse.json(
    {
      ...base,
      $id: `https://moltbookdowndetector.vercel.app/api/agent-check/schema?v=${encodeURIComponent(
        APP_VERSION
      )}`,
      examples: [example],
      docs: {
        endpoint: "/api/agent-check",
        formats: ["json", "text", "md"],
        query: {
          category: "site|api|docs|auth",
          name: "<exact probe name>",
          format: "json|text|md",
        },
        notes: [
          "If you request a scope with no matching probes, /api/agent-check returns 404 (to avoid false OK from an empty list).",
        ],
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    }
  );
}
