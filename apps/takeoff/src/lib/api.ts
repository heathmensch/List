// Helpers for calling Pluto. Add more functions here as new API routes appear.
// Home currently calls this from a Server Component, so fetch runs on the
// Takeoff Node process (localhost → localhost), not in the user's browser.

// Pluto's base URL. NEXT_PUBLIC_* is available on the server and, if we later
// fetch from a Client Component, would also be inlined into browser JS.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// JSON body returned by Pluto's GET /health route when it responds.
export type HealthResponse = {
  status: "ok" | "error";
  service: string;
  database: "connected" | "disconnected";
};

// Discriminated union: check result.ok to know which shape you have.
export type HealthResult =
  | { ok: true; data: HealthResponse }
  | { ok: false; reason: "unreachable" | "unhealthy" };

export async function getApiHealth(): Promise<HealthResult> {
  try {
    const response = await fetch(`${API_URL}/health`, {
      // Do not let Next's fetch cache reuse a previous /health response.
      cache: "no-store",
    });

    // HTTP error from Pluto (for example 503 when Postgres is down).
    if (!response.ok) {
      return { ok: false, reason: "unhealthy" };
    }

    const data = (await response.json()) as HealthResponse;
    return { ok: true, data };
  } catch {
    // fetch threw: connection refused, DNS failure, or wrong API_URL.
    return { ok: false, reason: "unreachable" };
  }
}
