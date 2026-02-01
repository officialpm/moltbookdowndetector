import { NextResponse } from "next/server";
import { APP_NAME, APP_VERSION } from "@/lib/version";

export const runtime = "nodejs";

/**
 * OpenAPI 3.0 spec for MoltBookDownDetector.
 *
 * Goal: make it easy for agents / tooling to discover endpoints, parameters,
 * and response shapes (including examples).
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  const spec = {
    openapi: "3.0.3",
    info: {
      title: "MoltBookDownDetector API",
      version: APP_VERSION,
      description:
        "Agent-friendly status probes for Moltbook uptime/reliability. Provides JSON, text, Markdown, badges, and Prometheus metrics.",
    },
    servers: [{ url: origin }],
    tags: [
      { name: "agent", description: "Agent-friendly endpoints" },
      { name: "status", description: "Status endpoints" },
      { name: "meta", description: "Discovery / metadata" },
    ],
    paths: {
      "/api/agent-check": {
        get: {
          tags: ["agent"],
          summary: "Agent-friendly status check",
          description:
            "Returns a compact summary (OK/BACKOFF), plus failures and degraded endpoints. Supports scoping by category or endpoint name.",
          parameters: [
            {
              name: "category",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["site", "api", "docs", "auth"] },
              description: "Limit probes to a single category.",
            },
            {
              name: "name",
              in: "query",
              required: false,
              schema: { type: "string" },
              description:
                "Limit probes to a single endpoint by its display name (URL-encode spaces).",
            },
            {
              name: "format",
              in: "query",
              required: false,
              schema: {
                type: "string",
                enum: ["json", "text", "plain", "md", "markdown"],
              },
              description:
                "Response format. Defaults to json; supports text/plain and text/markdown.",
            },
          ],
          responses: {
            "200": {
              description: "Agent check response",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AgentCheckResponse" },
                  examples: {
                    ok: {
                      summary: "All probes healthy",
                      value: {
                        ok: true,
                        checkedAt: "2026-01-31T06:05:00.000Z",
                        probeRegion: "sfo1",
                        authEnabled: false,
                        authProbesIncluded: 0,
                        totalProbes: 8,
                        totalFailures: 0,
                        totalTimeouts: 0,
                        totalDegraded: 1,
                        degradedThresholdMs: 2500,
                        byCategory: {
                          site: {
                            total: 2,
                            failures: 0,
                            timeouts: 0,
                            degraded: 0,
                            ok: true,
                          },
                          api: {
                            total: 4,
                            failures: 0,
                            timeouts: 0,
                            degraded: 1,
                            ok: true,
                          },
                        },
                        action: "OK",
                        recommendedBackoffMinutes: 0,
                        failures: [],
                        degraded: [
                          {
                            name: "Posts Feed",
                            category: "api",
                            status: 200,
                            ms: 2810,
                            url: "https://www.moltbook.com/api/posts",
                          },
                        ],
                      },
                    },
                    backoff: {
                      summary: "One or more probes failing",
                      value: {
                        ok: false,
                        checkedAt: "2026-01-31T06:05:00.000Z",
                        probeRegion: "sfo1",
                        authEnabled: false,
                        authProbesIncluded: 0,
                        totalProbes: 8,
                        totalFailures: 2,
                        totalTimeouts: 1,
                        totalDegraded: 0,
                        degradedThresholdMs: 2500,
                        byCategory: {
                          site: {
                            total: 2,
                            failures: 1,
                            timeouts: 1,
                            degraded: 0,
                            ok: false,
                          },
                        },
                        action: "BACKOFF",
                        recommendedBackoffMinutes: 20,
                        failures: [
                          {
                            name: "Homepage",
                            category: "site",
                            status: 0,
                            error: "timeout",
                            ms: 10000,
                            url: "https://www.moltbook.com/",
                          },
                        ],
                        degraded: [],
                      },
                    },
                  },
                },
                "text/plain": {
                  schema: { type: "string" },
                  examples: {
                    ok: {
                      summary: "Plain-text OK",
                      value:
                        "OK — checkedAt=2026-01-31T06:05:00.000Z — auth=off — probes=8, failures=0, timeouts=0, degraded=1; degraded: Posts Feed",
                    },
                    backoff: {
                      summary: "Plain-text BACKOFF",
                      value:
                        "BACKOFF — checkedAt=2026-01-31T06:05:00.000Z — auth=off — probes=8, failures=2, timeouts=1, degraded=0 — backoff=20m\nFailures:\n- Homepage [site] — timeout — 10000ms — /",
                    },
                  },
                },
                "text/markdown": {
                  schema: { type: "string" },
                  examples: {
                    ok: {
                      summary: "Markdown OK",
                      value:
                        "**OK**\n\n- checkedAt: 2026-01-31T06:05:00.000Z\n- authEnabled: false\n- authProbesIncluded: 0\n- probes: 8\n- failures: 0\n- timeouts: 0\n- degraded: 1\n\n**Degraded (slow but OK):**\n- Posts Feed (2810ms)",
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid query (e.g. unsupported category)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "Scope requested but no matching probes exist",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },

      "/api/agent-check/schema": {
        get: {
          tags: ["agent", "meta"],
          summary: "JSON Schema for /api/agent-check response",
          description:
            "Returns a machine-readable JSON Schema that matches the /api/agent-check JSON response.",
          responses: {
            "200": {
              description: "JSON Schema",
              content: {
                "application/json": {
                  schema: { type: "object" },
                },
              },
            },
          },
        },
      },

      "/api/agent-context": {
        get: {
          tags: ["agent"],
          summary: "Agent-readable integration context",
          parameters: [
            {
              name: "format",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["md", "markdown", "json"] },
              description:
                "Response format. Defaults to Markdown; use json for structured output.",
            },
          ],
          responses: {
            "200": {
              description: "Context payload",
              content: {
                "text/markdown": { schema: { type: "string" } },
                "application/json": {
                  schema: { $ref: "#/components/schemas/AgentContextResponse" },
                },
              },
            },
          },
        },
      },

      "/api/status": {
        get: {
          tags: ["status"],
          summary: "Dashboard-friendly status JSON",
          description:
            "Convenient for dashboards and UIs. Includes the latest probe results plus totals and region metadata.",
          responses: {
            "200": {
              description: "Status",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/StatusResponse" },
                },
              },
            },
          },
        },
      },

      "/api/check": {
        get: {
          tags: ["status"],
          summary: "Full raw probe results",
          description:
            "Returns the full probe list with timings, errors, and auth probe metadata. This is the base dataset used by other endpoints.",
          responses: {
            "200": {
              description: "Probe results",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ProbeResponse" },
                },
              },
            },
          },
        },
      },

      "/api/badge": {
        get: {
          tags: ["status"],
          summary: "Status badge (SVG)",
          parameters: [
            {
              name: "category",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["site", "api", "docs", "auth"] },
              description: "Badge scoped to category.",
            },
            {
              name: "name",
              in: "query",
              required: false,
              schema: { type: "string" },
              description: "Badge scoped to endpoint name.",
            },
          ],
          responses: {
            "200": {
              description: "SVG badge",
              content: {
                "image/svg+xml": {
                  schema: { type: "string" },
                },
              },
            },
          },
        },
      },

      "/api/metrics": {
        get: {
          tags: ["status"],
          summary: "Prometheus metrics",
          responses: {
            "200": {
              description: "Prometheus exposition format",
              content: { "text/plain": { schema: { type: "string" } } },
            },
          },
        },
      },

      "/api/openapi": {
        get: {
          tags: ["meta"],
          summary: "OpenAPI spec (this document)",
          responses: {
            "200": {
              description: "OpenAPI JSON",
              content: { "application/json": { schema: { type: "object" } } },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        ErrorResponse: {
          type: "object",
          additionalProperties: true,
          properties: {
            error: { type: "string" },
          },
          required: ["error"],
        },
        ProbeResult: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            url: { type: "string" },
            category: {
              type: "string",
              enum: ["site", "api", "docs", "auth"],
            },
            status: { type: "number" },
            ok: { type: "boolean" },
            ms: { type: "number" },
            error: { type: "string" },
          },
          required: ["name", "url", "category", "status", "ok", "ms"],
        },
        ProbeResponse: {
          type: "object",
          additionalProperties: false,
          properties: {
            ok: { type: "boolean" },
            checkedAt: { type: "string" },
            totalMs: { type: "number" },
            results: {
              type: "array",
              items: { $ref: "#/components/schemas/ProbeResult" },
            },
            authEnabled: { type: "boolean" },
            authProbesIncluded: { type: "number" },
          },
          required: [
            "ok",
            "checkedAt",
            "totalMs",
            "results",
            "authEnabled",
            "authProbesIncluded",
          ],
        },
        AgentCheckFailure: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            category: { type: "string" },
            status: { type: "number" },
            error: { type: "string" },
            ms: { type: "number" },
            url: { type: "string" },
          },
          required: ["name", "category", "ms", "url"],
        },
        AgentCheckByCategory: {
          type: "object",
          additionalProperties: {
            type: "object",
            additionalProperties: false,
            properties: {
              total: { type: "number" },
              failures: { type: "number" },
              timeouts: { type: "number" },
              degraded: { type: "number" },
              ok: { type: "boolean" },
            },
            required: ["total", "failures", "timeouts", "degraded", "ok"],
          },
        },
        AgentCheckResponse: {
          type: "object",
          additionalProperties: false,
          properties: {
            ok: { type: "boolean" },
            checkedAt: { type: "string" },
            probeRegion: { type: "string" },
            authEnabled: { type: "boolean" },
            authProbesIncluded: { type: "number" },
            scope: {
              type: "object",
              additionalProperties: false,
              properties: {
                category: { type: "string" },
                name: { type: "string" },
                probeRegion: { type: "string" },
              },
            },
            totalProbes: { type: "number" },
            totalFailures: { type: "number" },
            totalTimeouts: { type: "number" },
            totalDegraded: { type: "number" },
            degradedThresholdMs: { type: "number" },
            byCategory: { $ref: "#/components/schemas/AgentCheckByCategory" },
            action: { type: "string", enum: ["OK", "BACKOFF"] },
            recommendedBackoffMinutes: { type: "number" },
            failures: {
              type: "array",
              items: { $ref: "#/components/schemas/AgentCheckFailure" },
            },
            degraded: {
              type: "array",
              items: { $ref: "#/components/schemas/AgentCheckFailure" },
            },
          },
          required: [
            "ok",
            "checkedAt",
            "authEnabled",
            "authProbesIncluded",
            "totalProbes",
            "totalFailures",
            "totalTimeouts",
            "totalDegraded",
            "degradedThresholdMs",
            "byCategory",
            "action",
            "recommendedBackoffMinutes",
            "failures",
            "degraded",
          ],
        },
        AgentContextResponse: {
          type: "object",
          additionalProperties: true,
          properties: {
            title: { type: "string" },
            summary: { type: "string" },
            endpoints: { type: "array", items: { type: "string" } },
          },
        },
        StatusResponse: {
          type: "object",
          additionalProperties: true,
          properties: {
            ok: { type: "boolean" },
            checkedAt: { type: "string" },
            probeRegion: { type: "string" },
            totalMs: { type: "number" },
            results: {
              type: "array",
              items: { $ref: "#/components/schemas/ProbeResult" },
            },
            authEnabled: { type: "boolean" },
            authProbesIncluded: { type: "number" },
          },
        },
      },
    },
    "x-app": {
      name: APP_NAME,
      version: APP_VERSION,
      repo: "https://github.com/officialpm/moltbookdowndetector",
    },
  };

  return NextResponse.json(spec, {
    headers: {
      // This is small and safe to cache, but varies by host (origin), so keep it short.
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
