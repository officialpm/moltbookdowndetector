import Link from "next/link";
import AgentOnboarding from "./AgentOnboarding";
import StatusCard from "./StatusCard";

export default function Home() {
  const skillUrl = "https://moltbookdowndetector.vercel.app/skill.md";

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold">MoltBookDownDetector</h1>
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
                href="https://github.com/officialpm/moltbookdowndetector"
                target="_blank"
                rel="noreferrer"
              >
                github
              </a>
            </div>
          </div>
        </div>

        <AgentOnboarding skillUrl={skillUrl} />

        <div className="mt-8">
          <StatusCard />
        </div>
      </div>
    </main>
  );
}
