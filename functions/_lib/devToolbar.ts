/** Narrow Pages Function types for the FIT-only developer helper endpoints. */
export type DevToolbarEnvironment = {
  API_TUNNEL_URL?: string;
  ACCESS_SERVICE_TOKEN_CLIENT_ID?: string;
  ACCESS_SERVICE_TOKEN_CLIENT_SECRET?: string;
  AURA_ENV?: string;
  AURA_DEV_TOOLBAR_ENABLED?: string;
  AURA_DEV_TEST_CLIENTS_JSON?: string;
};

export type DevToolbarContext = { request: Request; env: DevToolbarEnvironment };
export type DevToolbarFunction = (context: DevToolbarContext) => Promise<Response>;
type TestClient = { id: string; label: string; email: string; password: string };

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

/** Makes toolbar routes unreachable unless an operator enables them in a FIT Pages environment. */
export function isFitToolbarEnabled(env: DevToolbarEnvironment): boolean {
  return env.AURA_ENV === "FIT" && env.AURA_DEV_TOOLBAR_ENABLED === "true";
}

/** Returns validated server-side synthetic credentials without exposing them to the browser. */
function readClients(env: DevToolbarEnvironment): TestClient[] | null {
  if (!env.AURA_DEV_TEST_CLIENTS_JSON) return null;
  try {
    const parsed = JSON.parse(env.AURA_DEV_TEST_CLIENTS_JSON) as { clients?: unknown };
    if (!Array.isArray(parsed.clients) || parsed.clients.length !== 2) return null;
    const clients = parsed.clients as TestClient[];
    const valid = clients.every(client => client && typeof client.id === "string" && /^[a-z0-9-]{1,40}$/i.test(client.id)
      && typeof client.label === "string" && /\b(test|synthetic)\b/i.test(client.label)
      && typeof client.email === "string" && /@(?:example\.test|example\.com)$/i.test(client.email)
      && typeof client.password === "string" && client.password.length >= 8);
    if (!valid || new Set(clients.map(client => client.id)).size !== 2) return null;
    return clients;
  } catch {
    return null;
  }
}

function configuredApiOrigin(env: DevToolbarEnvironment): URL | null {
  try {
    const api = new URL(env.API_TUNNEL_URL ?? "");
    if (api.protocol !== "https:" || api.username || api.password || api.pathname !== "/" || api.search || api.hash) return null;
    return api;
  } catch {
    return null;
  }
}

/** Adds the Pages service identity on the server and keeps upstream redirects private. */
async function callFitApi(env: DevToolbarEnvironment, path: string, init: RequestInit = {}): Promise<Response> {
  const origin = configuredApiOrigin(env);
  if (!origin || !env.ACCESS_SERVICE_TOKEN_CLIENT_ID || !env.ACCESS_SERVICE_TOKEN_CLIENT_SECRET) {
    throw new Error("FIT developer service is not configured.");
  }
  const headers = new Headers(init.headers);
  headers.delete("Cf-Access-Client-Id");
  headers.delete("Cf-Access-Client-Secret");
  headers.set("Cf-Access-Client-Id", env.ACCESS_SERVICE_TOKEN_CLIENT_ID);
  headers.set("Cf-Access-Client-Secret", env.ACCESS_SERVICE_TOKEN_CLIENT_SECRET);
  return fetch(new URL(path, origin), { ...init, headers, redirect: "manual" });
}

/** Implements the remote FIT readiness route without returning upstream diagnostics. */
export const handleFitStatus: DevToolbarFunction = async ({ env }) => {
  if (!isFitToolbarEnabled(env)) return jsonResponse(404, { error: "Not found." });
  try {
    const response = await callFitApi(env, "/health/database", { method: "GET" });
    return jsonResponse(response.ok ? 200 : 503, {
      state: response.ok ? "ready" : "failed",
      detail: response.ok ? "FIT API and database are ready." : "FIT API health check failed.",
    });
  } catch {
    return jsonResponse(503, { state: "failed", detail: "FIT API is unavailable through Access and Tunnel." });
  }
};

/** Lists the two configured synthetic FIT clients without exposing their login credentials. */
export const handleFitClients: DevToolbarFunction = async ({ env }) => {
  if (!isFitToolbarEnabled(env)) return jsonResponse(404, { error: "Not found." });
  const clients = readClients(env);
  if (!clients) return jsonResponse(503, { clients: [], error: "FIT synthetic test clients are not configured." });
  return jsonResponse(200, { clients: clients.map(({ id, label }) => ({ id, label })) });
};

/** Signs in a selected synthetic account through Aura's ordinary API login endpoint. */
export const handleFitTestLogin: DevToolbarFunction = async ({ request, env }) => {
  if (!isFitToolbarEnabled(env)) return jsonResponse(404, { error: "Not found." });
  const requestOrigin = request.headers.get("origin");
  if (!requestOrigin || requestOrigin !== new URL(request.url).origin) {
    return jsonResponse(403, { error: "This FIT developer action is not available from this origin." });
  }
  const clients = readClients(env);
  if (!clients) return jsonResponse(503, { error: "FIT synthetic test clients are not configured." });
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 2048 || request.headers.get("content-type")?.split(";")[0] !== "application/json") {
    return jsonResponse(400, { error: "Choose one configured synthetic test client." });
  }
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).length > 2048) return jsonResponse(400, { error: "Choose one configured synthetic test client." });
    const body = JSON.parse(text) as { clientId?: unknown } | null;
    if (!body || typeof body !== "object" || typeof body.clientId !== "string" || Object.keys(body).some(key => key !== "clientId")) {
      return jsonResponse(400, { error: "Choose one configured synthetic test client." });
    }
    const client = clients.find(item => item.id === body.clientId);
    if (!client) return jsonResponse(404, { error: "That synthetic test client is not configured." });
    const upstream = await callFitApi(env, "/api/Auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: client.email, password: client.password }),
    });
    if (!upstream.ok) return jsonResponse(401, { error: "Synthetic sign-in failed. Check the FIT test-account setup." });
    const result = await upstream.json() as { token?: unknown };
    if (typeof result.token !== "string" || !result.token) return jsonResponse(502, { error: "The API returned an unexpected sign-in response." });
    return jsonResponse(200, { token: result.token });
  } catch {
    return jsonResponse(503, { error: "FIT synthetic sign-in is unavailable." });
  }
};
