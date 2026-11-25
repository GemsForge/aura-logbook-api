import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createDevControlServer, readDevTestClients } from "./dev-control.mjs";
import { createServicePlan, findAvailablePort, runDevelopment } from "./dev.mjs";

const sampleClients = [
  { id: "synthetic-a", label: "Synthetic Test Client A", email: "a@example.test", password: "sample-password-a" },
  { id: "synthetic-b", label: "Synthetic Test Client B", email: "b@example.test", password: "sample-password-b" },
];

async function withControlServer(options, run) {
  const server = createDevControlServer({
    lifecycle: { start: async () => {}, stop: async () => {}, restart: async () => {}, status: () => ({ state: "running" }) },
    apiBaseUrl: "http://127.0.0.1:5082/api",
    uiPort: 58407,
    controlPort: 0,
    clients: sampleClients,
    fetchImpl: async () => new Response(JSON.stringify({ status: "healthy" }), { status: 200 }),
    ...options,
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address === "object");
  try {
    await run(`http://127.0.0.1:${address.port}`, address.port);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

const sameOriginHeaders = port => ({ Origin: "http://localhost:58407", Host: `127.0.0.1:${port}` });

class FakeChild extends EventEmitter {
  constructor(pid, command) {
    super();
    this.pid = pid;
    this.command = command;
    this.exitCode = null;
    this.signalCode = null;
    this.stdout = new EventEmitter();
    this.stderr = new EventEmitter();
  }
}

test("the developer toolbar is enabled only for an explicitly local non-production launcher", () => {
  const dev = createServicePlan({ root: "/repo", env: {} });
  const fit = createServicePlan({ root: "/repo", env: { AURA_ENV: "FIT" } });
  const production = createServicePlan({ root: "/repo", env: { AURA_ENV: "PRO" } });
  const remote = createServicePlan({ root: "/repo", env: { VITE_API_BASE_URL: "https://fit.example.test/api" } });
  assert.equal(dev[1].env.VITE_AURA_DEV_TOOLBAR, "true");
  assert.equal(fit[1].env.VITE_AURA_DEV_TOOLBAR, "true");
  assert.equal(production[1].env.VITE_AURA_DEV_TOOLBAR, "false");
  assert.equal(remote[1].env.VITE_AURA_DEV_TOOLBAR, "false");
  assert.equal(remote[1].env.AURA_DEV_CONTROL_TARGET, undefined);
});

test("test credentials stay in the ignored local config and the public client list contains labels only", () => {
  const root = mkdtempSync(join(tmpdir(), "aura-dev-clients-"));
  mkdirSync(join(root, "Scripts"));
  writeFileSync(join(root, "Scripts", "dev-test-clients.local.json"), JSON.stringify({ clients: sampleClients }));
  try {
    const loaded = readDevTestClients(root);
    assert.equal(loaded.error, null);
    assert.deepEqual(loaded.clients, sampleClients);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
  const missing = readDevTestClients(root);
  assert.deepEqual(missing.clients, []);
  assert.match(missing.error, /clients are configured/);
});

test("test-client config rejects non-synthetic identities and malformed account counts", () => {
  const root = mkdtempSync(join(tmpdir(), "aura-dev-clients-invalid-"));
  mkdirSync(join(root, "Scripts"));
  writeFileSync(join(root, "Scripts", "dev-test-clients.local.json"), JSON.stringify({ clients: [{ ...sampleClients[0], email: "person@real.invalid" }] }));
  try {
    assert.deepEqual(readDevTestClients(root).clients, []);
    assert.match(readDevTestClients(root).error, /configuration is invalid/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("control API rejects an untrusted Origin before executing an action", async () => {
  let started = false;
  await withControlServer({
    lifecycle: { start: async () => { started = true; }, stop: async () => {}, restart: async () => {}, status: () => ({ state: "running" }) },
  }, async (baseUrl, port) => {
    const response = await fetch(`${baseUrl}/__aura_dev/action`, {
      method: "POST", headers: { ...sameOriginHeaders(port), Origin: "https://attacker.example", "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    });
    assert.equal(response.status, 403);
    assert.equal(started, false);
  });
});

test("fixed lifecycle actions are allowed while arbitrary commands and payloads are rejected", async () => {
  const actions = [];
  await withControlServer({
    lifecycle: {
      start: async () => actions.push("start"), stop: async () => actions.push("stop"),
      restart: async () => actions.push("restart"), status: () => ({ state: "running" }),
    },
  }, async (baseUrl, port) => {
    const headers = { ...sameOriginHeaders(port), "Content-Type": "application/json" };
    const accepted = await fetch(`${baseUrl}/__aura_dev/action`, { method: "POST", headers, body: JSON.stringify({ action: "restart" }) });
    assert.equal(accepted.status, 200);
    const rejected = await fetch(`${baseUrl}/__aura_dev/action`, { method: "POST", headers, body: JSON.stringify({ action: "exec", command: "rm -rf /" }) });
    assert.equal(rejected.status, 400);
    assert.deepEqual(actions, ["restart"]);
  });
});

test("status reports stopped instead of trusting a health endpoint the launcher does not own", async () => {
  let healthCalls = 0;
  await withControlServer({
    lifecycle: { start: async () => {}, stop: async () => {}, restart: async () => {}, status: () => ({ state: "stopped" }) },
    fetchImpl: async () => { healthCalls += 1; return new Response("{}", { status: 200 }); },
  }, async (baseUrl, port) => {
    const response = await fetch(`${baseUrl}/__aura_dev/status`, { headers: sameOriginHeaders(port) });
    assert.deepEqual(await response.json(), { state: "stopped", detail: "The local API is stopped." });
    assert.equal(healthCalls, 0);
  });
});

test("client listing and login keep passwords out of the public config response", async () => {
  let apiLoginBody;
  await withControlServer({
    fetchImpl: async (_url, request) => {
      apiLoginBody = JSON.parse(request.body);
      return new Response(JSON.stringify({ token: "synthetic-token" }), { status: 200 });
    },
  }, async (baseUrl, port) => {
    const headers = { ...sameOriginHeaders(port), "Content-Type": "application/json" };
    const clientsResponse = await fetch(`${baseUrl}/__aura_dev/test-clients`, { headers: sameOriginHeaders(port) });
    const clientsPayload = await clientsResponse.text();
    assert.equal(clientsResponse.status, 200);
    assert.deepEqual(JSON.parse(clientsPayload), { clients: [{ id: "synthetic-a", label: "Synthetic Test Client A" }, { id: "synthetic-b", label: "Synthetic Test Client B" }] });
    assert.doesNotMatch(clientsPayload, /password|example\.test/);

    const login = await fetch(`${baseUrl}/__aura_dev/test-login`, { method: "POST", headers, body: JSON.stringify({ clientId: "synthetic-a" }) });
    const loginPayload = await login.text();
    assert.equal(login.status, 200);
    assert.deepEqual(JSON.parse(loginPayload), { token: "synthetic-token" });
    assert.doesNotMatch(loginPayload, /password|example\.test/);
    assert.deepEqual(apiLoginBody, { email: "a@example.test", password: "sample-password-a" });
  });
});

test("launcher lifecycle actions stop, restart, and recover only its owned API child", async () => {
  const controlPort = await findAvailablePort(59000);
  const signalSource = new EventEmitter();
  const children = [];
  const stopped = [];
  const run = runDevelopment({
    platform: "linux",
    signalSource,
    log: () => {},
    plan: [
      { name: "API", command: "dotnet", args: [], cwd: "/repo/AuraLogbook.Api", env: {} },
      { name: "UI", command: "npm", args: [], cwd: "/repo/aura-ui", env: {} },
    ],
    spawnProcess: command => {
      const child = new FakeChild(children.length + 1, command);
      children.push(child);
      return child;
    },
    stop: async child => {
      stopped.push(child);
      child.exitCode = 0;
      child.emit("exit", 0, "SIGTERM");
    },
    control: {
      apiBaseUrl: "http://127.0.0.1:5082/api",
      uiPort: 58407,
      controlPort,
      fetchImpl: async () => new Response("{}", { status: 200 }),
    },
  });

  const baseUrl = `http://127.0.0.1:${controlPort}`;
  const headers = { ...sameOriginHeaders(controlPort), "Content-Type": "application/json" };
  const waitForApi = async () => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        const status = await fetch(`${baseUrl}/__aura_dev/status`, { headers: sameOriginHeaders(controlPort) });
        const body = await status.json();
        if (body.state === "ready" || body.state === "failed") return body;
      } catch {
        // The loopback server binds asynchronously just after the launcher starts.
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error("API state did not settle in time.");
  };

  try {
    const ready = await waitForApi();
    assert.equal(ready.state, "ready");
    const initialApi = children.find(child => child.command === "dotnet");
    assert.ok(initialApi);

    const stoppedResponse = await fetch(`${baseUrl}/__aura_dev/action`, { method: "POST", headers, body: JSON.stringify({ action: "stop" }) });
    assert.equal(stoppedResponse.status, 200);
    assert.equal(stopped.at(-1), initialApi);
    assert.equal((await (await fetch(`${baseUrl}/__aura_dev/status`, { headers: sameOriginHeaders(controlPort) })).json()).state, "stopped");

    const started = await fetch(`${baseUrl}/__aura_dev/action`, { method: "POST", headers, body: JSON.stringify({ action: "start" }) });
    assert.equal(started.status, 200);
    await waitForApi();
    const restarted = await fetch(`${baseUrl}/__aura_dev/action`, { method: "POST", headers, body: JSON.stringify({ action: "restart" }) });
    assert.equal(restarted.status, 200);
    await waitForApi();
    const latestApi = children.filter(child => child.command === "dotnet").at(-1);
    assert.ok(latestApi && latestApi !== initialApi);

    latestApi.emit("exit", 1, null);
    assert.equal((await (await fetch(`${baseUrl}/__aura_dev/status`, { headers: sameOriginHeaders(controlPort) })).json()).state, "failed");
    const recovered = await fetch(`${baseUrl}/__aura_dev/action`, { method: "POST", headers, body: JSON.stringify({ action: "restart" }) });
    assert.equal(recovered.status, 200);
    await waitForApi();
  } finally {
    signalSource.emit("SIGINT");
    assert.equal(await run, 130);
  }
});
