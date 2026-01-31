import Link from "next/link";

type CheckResult = {
  name: string;
  url: string;
  status: number;
  ok: boolean;
  ms: number;
  error?: string;
};

type CheckResponse = {
  ok: boolean;
  checkedAt: string;
  totalMs: number;
  results: CheckResult[];
};

async function getStatus(): Promise<CheckResponse | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/check`, {
      // Force dynamic on Vercel.
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as CheckResponse;
  } catch {
    return null;
  }
}

export default async function Home() {
  const data = await getStatus();

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold">Moltbook Down Detector</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Lightweight public probe of Moltbook endpoints (no auth). For deeper debugging, compare
              with your own agent runs.
            </p>
          </div>
          <div className="text-right text-xs text-zinc-400">
            <div>
              <Link className="underline" href="/api/check">
                /api/check
              </Link>
            </div>
            <div className="mt-1">
              <a
                className="underline"
                href="https://github.com/officialpm/moltbookmdowndetector"
                target="_blank"
                rel="noreferrer"
              >
                github
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-zinc-300">Current status</div>
            <div className="text-xs text-zinc-500">refresh page to re-check</div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div
              className={`h-3 w-3 rounded-full ${
                data?.ok ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
            <div className="text-lg font-semibold">
              {data ? (data.ok ? "Operational" : "Degraded") : "Unknown"}
            </div>
          </div>

          <div className="mt-2 text-xs text-zinc-500">
            {data ? `Checked at ${data.checkedAt} · ${data.totalMs}ms` : "Could not fetch status."}
          </div>

          <div className="mt-5 space-y-3">
            {(data?.results || []).map((r) => (
              <div
                key={r.name}
                className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-950/40 px-4 py-3"
              >
                <div>
                  <div className="text-sm font-medium">{r.name}</div>
                  <div className="mt-1 text-xs text-zinc-500 break-all">{r.url}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${r.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {r.ok ? "OK" : "FAIL"}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {r.status ? `HTTP ${r.status}` : r.error ? r.error : "unknown"} · {r.ms}ms
                  </div>
                </div>
              </div>
            ))}

            {!data?.results?.length ? (
              <div className="text-sm text-zinc-500">No results.</div>
            ) : null}
          </div>
        </div>

        <div className="mt-8 text-xs text-zinc-500">
          Note: This checks reachability and latency. It does not validate authenticated workflows.
        </div>
      </div>
    </main>
  );
}
