"use client";

type RefreshButtonProps = {
  onClick: () => void;
  loading: boolean;
  lastRefresh?: Date;
};

export default function RefreshButton({ onClick, loading, lastRefresh }: RefreshButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="group flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-300 transition-all hover:border-zinc-600 hover:bg-zinc-800/60 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg
        className={`h-4 w-4 transition-transform ${loading ? "animate-spin" : "group-hover:rotate-180"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      <span>{loading ? "Checking..." : "Refresh"}</span>
      {lastRefresh && !loading && (
        <span className="text-zinc-500">
          {Math.round((Date.now() - lastRefresh.getTime()) / 1000)}s ago
        </span>
      )}
    </button>
  );
}
