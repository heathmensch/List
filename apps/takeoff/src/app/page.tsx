import { getApiHealth } from "@/lib/api";

// Skip the Full Route Cache / static HTML. This page must hit Pluto on every
// request so the status pills are not stale from a previous render.
export const dynamic = "force-dynamic";

// Presentational badge. Rendered on the server as HTML, not as a client island.
function StatusPill({
  ok,
  label,
}: {
  ok: boolean;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
        ok
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`}
      />
      {label}
    </span>
  );
}

// Home page (`/`). This is an async Server Component: Next.js runs it on the
// Takeoff server, awaits Pluto, then streams HTML to the browser. The user's
// browser never calls /health itself for this page.
export default async function Home() {
  const health = await getApiHealth();
  const apiOk = health.ok;
  const databaseOk = health.ok && health.data.database === "connected";

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-10">
        <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase">
          Local development
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Stats Platform
        </h1>
        <p className="mt-3 max-w-lg text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Next.js frontend, Node.js API, and PostgreSQL are wired up. This page
          talks to the API health endpoint so you can confirm the stack is
          running.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <StatusPill ok={apiOk} label={apiOk ? "API connected" : "API unreachable"} />
          <StatusPill
            ok={databaseOk}
            label={databaseOk ? "PostgreSQL connected" : "PostgreSQL disconnected"}
          />
        </div>

        {!apiOk && (
          <p className="mt-6 text-sm leading-6 text-zinc-500">
            Start Postgres with <code className="font-mono">pnpm db:up</code>, then
            run <code className="font-mono">pnpm dev</code> from the repo root.
          </p>
        )}
      </main>
    </div>
  );
}
