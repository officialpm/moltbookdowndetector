import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  // Lightweight, human/agent-consumable JSON Schema for /api/agent-check
  // (kept manual to avoid shipping schema/zod deps to the edge)
  return NextResponse.json(
    {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      title: "AgentCheckResponse",
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
        checkedAt: { type: "string", description: "ISO timestamp" },
        action: { type: "string", enum: ["OK", "BACKOFF"] },
        recommendedBackoffMinutes: { type: "number", minimum: 0 },
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
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
