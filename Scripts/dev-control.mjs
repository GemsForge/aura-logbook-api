import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const clientFileName = "dev-test-clients.local.json";

/** Loads exactly two fictional test accounts from the ignored local companion configuration. */
export function readDevTestClients(root) {
  const path = resolve(root, "Scripts", clientFileName);
  if (!existsSync(path)) return { clients: [], error: "No local synthetic test clients are configured." };
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    if (!Array.isArray(parsed.clients) || parsed.clients.length !== 2) throw new Error("expected two clients");
    const clients = parsed.clients.map(client => {
      if (!client || !/^[a-z0-9-]{1,40}$/i.test(client.id) || typeof client.label !== "string"
        || !/\b(test|synthetic)\b/i.test(client.label) || typeof client.email !== "string"
        || !/@(?:example\.test|example\.com)$/i.test(client.email) || typeof client.password !== "string"
        || client.password.length < 8) throw new Error("invalid client entry");
      return { id: client.id, label: client.label, email: client.email, password: client.password };
    });
    if (new Set(clients.map(client => client.id)).size !== 2) throw new Error("duplicate client ids");
    return { clients, error: null };
  } catch {
    return { clients: [], error: "The local synthetic test-client configuration is invalid. Check Scripts/dev-test-clients.local.json." };
  }
}

function sendJson(response, status, value) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  response.end(JSON.stringify(value));
}

async function readRequestJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 2048) throw new Error("request too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

/** Creates a loopback-only, same-origin API for fixed local developer actions and test sign-in. */
export function createDevControlServer({ lifecycle, apiBaseUrl, uiPort, controlPort, clients = [], configurationError = null, fetchImpl = fetch }) {
  const allowedOrigins = new Set([`http://127.0.0.1:${uiPort}`, `http://localhost:${uiPort}`]);
  const server = createServer(async (request, response) => {
    const origin = request.headers.origin;
    const boundPort = server.address()?.port ?? controlPort;
    const expectedHosts = new Set([`127.0.0.1:${boundPort}`, `localhost:${boundPort}`]);
    const originIsUnsafe = origin ? !allowedOrigins.has(origin) : request.method !== "GET";
    if (!expectedHosts.has(request.headers.host) || originIsUnsafe) {
      sendJson(response, 403, { error: "This local developer action is not available from this origin." });
      return;
    }
    if (request.method === "OPTIONS") {
      response.writeHead(204, { "Allow": "GET, POST, OPTIONS", "Cache-Control": "no-store" });
      response.end();
      return;
    }

    const path = new URL(request.url ?? "/", `http://${request.headers.host}`).pathname;
    if (path === "/__aura_dev/status" && request.method === "GET") {
      const processState = lifecycle.status();
      if (processState.state !== "running") {
        const stopped = processState.state === "stopped";
        sendJson(response, 200, stopped
          ? { state: "stopped", detail: "The local API is stopped." }
          : { state: "failed", detail: "The API stopped unexpectedly. Restart it from this toolbar." });
        return;
      }
      try {
        const health = await fetchImpl(`${apiBaseUrl.replace(/\/$/, "")}/../health/database`, { signal: AbortSignal.timeout(1500) });
        sendJson(response, health.ok ? 200 : 503, { state: health.ok ? "ready" : "failed", detail: health.ok ? "API and database are ready." : "API health check failed." });
      } catch {
        sendJson(response, 200, { state: "starting", detail: "Waiting for the API health check." });
      }
      return;
    }
    if (path === "/__aura_dev/test-clients" && request.method === "GET") {
      sendJson(response, configurationError ? 503 : 200, configurationError
        ? { clients: [], error: configurationError }
        : { clients: clients.map(({ id, label }) => ({ id, label })) });
      return;
    }
    if (path === "/__aura_dev/action" && request.method === "POST") {
      if (request.headers["content-type"]?.split(";")[0] !== "application/json") {
        sendJson(response, 415, { error: "Use a JSON action request." });
        return;
      }
      try {
        const body = await readRequestJson(request);
        if (!body || !["start", "stop", "restart"].includes(body.action) || Object.keys(body).some(key => key !== "action")) {
          sendJson(response, 400, { error: "Choose start, stop, or restart." });
          return;
        }
        await lifecycle[body.action]();
        sendJson(response, 200, { state: lifecycle.status().state });
      } catch {
        sendJson(response, 500, { error: "The local API action failed. Check the launcher output for setup errors." });
      }
      return;
    }
    if (path === "/__aura_dev/test-login" && request.method === "POST") {
      if (request.headers["content-type"]?.split(";")[0] !== "application/json") {
        sendJson(response, 415, { error: "Use a JSON test-client selection." });
        return;
      }
      try {
        const body = await readRequestJson(request);
        if (!body || typeof body.clientId !== "string" || Object.keys(body).some(key => key !== "clientId")) {
          sendJson(response, 400, { error: "Choose one configured synthetic test client." });
          return;
        }
        const client = clients.find(item => item.id === body.clientId);
        if (!client) {
          sendJson(response, 404, { error: "That synthetic test client is not configured." });
          return;
        }
        const loginResponse = await fetchImpl(`${apiBaseUrl.replace(/\/$/, "")}/Auth/login`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: client.email, password: client.password }),
          signal: AbortSignal.timeout(10000),
        });
        if (!loginResponse.ok) {
          sendJson(response, 401, { error: "Synthetic sign-in failed. Check the test account setup and API output." });
          return;
        }
        const result = await loginResponse.json();
        if (typeof result?.token !== "string" || !result.token) {
          sendJson(response, 502, { error: "The API returned an unexpected sign-in response." });
          return;
        }
        sendJson(response, 200, { token: result.token });
      } catch {
        sendJson(response, 503, { error: "Synthetic sign-in is unavailable until the local API is ready." });
      }
      return;
    }
    sendJson(response, 404, { error: "Local developer route not found." });
  });
  server.on("error", () => {});
  return server;
}
