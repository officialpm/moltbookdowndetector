import { NextResponse } from "next/server";
import type { AgentCheckResponse } from "../route";
import { APP_NAME, APP_VERSION } from "@/lib/version";

export const runtime = "nodejs";

// This endpoint exists for tooling/agent integrations that want a stable,
// machine-readable response shape.
//
// Note: we keep the schema lightweight and dependency-free (no zod), since this
// runs on Vercel and we want to avoid runtime bloat.

type JsonSchema = Record<string, unknown>;

function agentCheckResponseSchema(): JsonSchema {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `https://moltbookdowndetector.vercel.app/api/agent-check/schema?v=${APP_VERSION}`,
    title: "MoltBookDownDetector AgentCheckResponse",
    type: "object",
    additionalProperties: false,
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
    properties: {
      ok: { type: "boolean" },
      checkedAt: {
        type: "string",
        description: "ISO timestamp when probes were executed",
      },
      scope: {
        type: "object",
        additionalProperties: false,
        required: [],
        properties: {
          category: { type: "string" },
          name: { type: "string" },
        },
        description:
          "Optional scope if the caller requested a subset via ?category= or ?name=",
      },
      totalProbes: {
        type: "number",
        description: "How many probes were evaluated after applying any requested scope",
      },
      totalFailures: {
        type: "number",
        description: "How many probes are failing (ok=false)",
      },
      totalDegraded: {
        type: "number",
        description:
          "How many probes are considered degraded (ok=true but slow based on degradedThresholdMs)",
      },
      degradedThresholdMs: {
        type: "number",
        description: "Latency threshold used to classify degraded probes",
      },
      byCategory: {
        type: "object",
        additionalProperties: {
          type: "object",
          additionalProperties: false,
          required: ["total", "failures", "degraded", "ok"],
          properties: {
            total: { type: "number" },
            failures: { type: "number" },
            degraded: { type: "number" },
            ok: { type: "boolean" },
          },
        },
        description:
          "Category-level summary counts for the scoped probe set (keys typically: site|api|docs|auth)",
      },
      action: { type: "string", enum: ["OK", "BACKOFF"] },
      recommendedBackoffMinutes: {
        type: "number",
        description:
          "Suggested backoff window for write-heavy actions when unhealthy (0 when OK)",
      },
      failures: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "category", "status", "ms", "url"],
          properties: {
            name: { type: "string" },
            category: { type: "string" },
            status: { type: "number" },
            error: { type: ["string", "null"] },
            ms: { type: "number" },
            url: { type: "string" },
          },
        },
      },
      degraded: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "category", "status", "ms", "url"],
          properties: {
            name: { type: "string" },
            category: { type: "string" },
            status: { type: "number" },
            error: { type: ["string", "null"] },
            ms: { type: "number" },
            url: { type: "string" },
          },
        },
      },
    },
  };
}

function exampleResponse(): AgentCheckResponse {
  return {
    ok: false,
    checkedAt: new Date(0).toISOString(),
    scope: { category: "api" },

    totalProbes: 3,
    totalFailures: 1,
    totalDegraded: 1,
    degradedThresholdMs: 2500,
    byCategory: {
      api: { total: 3, failures: 1, degraded: 1, ok: false },
    },

    action: "BACKOFF",
    recommendedBackoffMinutes: 20,
    failures: [
      {
        name: "Posts Feed",
        category: "api",
        status: 0,
        error: "timeout",
        ms: 5000,
        url: "https://www.moltbook.com/api/v1/posts?sort=new&limit=1",
      },
    ],
    degraded: [
      {
        name: "Post Detail",
        category: "api",
        status: 200,
        error: undefined,
        ms: 3800,
        url: "https://www.moltbook.com/api/v1/posts/abc123",
      },
    ],
  };
}

export async function GET() {
  return NextResponse.json(
    {
      app: {
        name: APP_NAME,
        version: APP_VERSION,
      },
      query: {
        description:
          "Optional scoping params: ?category=site|api|docs|auth and/or ?name=<probe name>. Optional output format: ?format=json|text|markdown (default json).",
      },
      responseSchema: agentCheckResponseSchema(),
      example: exampleResponse(),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    }
  );
}
