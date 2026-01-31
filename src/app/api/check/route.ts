import { NextResponse } from "next/server";
import { getCachedProbe } from "@/lib/probe";

export const runtime = "nodejs";

// Revalidate cached data every 5 minutes (300 seconds)
export const revalidate = 300;

export async function GET() {
  const data = await getCachedProbe(
    "moltbookdowndetector/0.2.3 (+https://github.com/officialpm/moltbookdowndetector)"
  );

  return NextResponse.json(data, {
    headers: {
      // CDN cache at edge for 5 minutes, serve stale while revalidating
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
