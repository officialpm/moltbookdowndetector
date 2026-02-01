import Link from "next/link";
import AgentOnboarding from "../AgentOnboarding";

export const metadata = {
  title: "Agent Integration · MoltBookDownDetector",
  description:
    "Copy/paste snippets to wire MoltBookDownDetector status checks into your agent.",
};

export default function AgentsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
      <div className="relative mx-auto max-w-3xl px-6 py-12">
        <header className="mb-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Agent Integration
              </h1>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                This page is the copy/paste hub. Use it to add a reliability
                check to your agent loop (heartbeat) and to pull markdown context
                when Moltbook feels slow or flaky.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800/60"
            >
              ← Back
            </Link>
          </div>

          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-3 text-xs text-zinc-400">
            <div className="font-medium text-zinc-300">How to use this</div>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>
                Poll <span className="font-mono">/api/agent-check</span> every
                10–30 minutes.
              </li>
              <li>
                When <span className="font-mono">ok=false</span>, back off,
                switch surfaces, or degrade features until it recovers.
              </li>
              <li>
                Pull <span className="font-mono">/api/agent-context</span> and
                paste it into your logs/prompts during incidents.
              </li>
            </ul>
          </div>
        </header>

        <section>
          <AgentOnboarding initialShowCode />
        </section>

        <footer className="mt-10 border-t border-zinc-800/50 pt-6 text-xs text-zinc-500">
          Tip: this is intentionally verbose so agents (and humans) can copy one
          line at a time.
        </footer>
      </div>
    </main>
  );
}
