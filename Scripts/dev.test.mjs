import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createDevelopmentPlan, createServicePlan, findAvailablePort, resolveApiEnvironment, runDevelopment, terminateProcessTree } from "./dev.mjs";

test("root npm dev alias runs the combined development launcher", () => {
  const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

  assert.equal(packageJson.scripts.dev, "node Scripts/dev.mjs");
});

class FakeChild extends EventEmitter {
  constructor(pid) {
    super();
    this.pid = pid;
    this.exitCode = null;
    this.signalCode = null;
    this.stdout = new EventEmitter();
    this.stderr = new EventEmitter();
    this.kill = () => {};
  }
}

test("service plan uses the HTTP launch profile and the configured development ports", () => {
  const plan = createServicePlan({ root: "/repo", platform: "linux", env: {} });

  assert.equal(plan[0].command, "dotnet");
  assert.deepEqual(plan[0].args, ["run", "--project", "AuraLogbook.Api.csproj", "--launch-profile", "http"]);
  assert.equal(plan[0].cwd, "/repo/AuraLogbook.Api");
  assert.equal(plan[1].command, "npm");
  assert.deepEqual(plan[1].args, ["run", "dev", "--", "--host", "127.0.0.1", "--port", "58407", "--strictPort"]);
  assert.equal(plan[1].cwd, "/repo/aura-ui");
  assert.equal(plan[1].env.VITE_API_BASE_URL, "http://localhost:5082/api");
});

test("environment aliases resolve to the API configuration names", () => {
  assert.equal(resolveApiEnvironment("DEV"), "Development");
  assert.equal(resolveApiEnvironment("fit"), "Staging");
  assert.equal(resolveApiEnvironment("PRO"), "Production");
  assert.equal(resolveApiEnvironment("Custom"), "Custom");
});

test("service plan passes the resolved environment to the API", () => {
  const plan = createServicePlan({ root: "/repo", platform: "linux", env: { AURA_ENV: "FIT" } });

  assert.equal(plan[0].env.ASPNETCORE_ENVIRONMENT, "Staging");
});

test("service plan supports alternate ports for parallel local instances", () => {
  const plan = createServicePlan({ root: "/repo", platform: "linux", env: { AURA_API_PORT: "5082", AURA_UI_PORT: "58408" } });

  assert.deepEqual(plan[0].args, ["run", "--project", "AuraLogbook.Api.csproj", "--launch-profile", "http", "--", "--urls", "http://localhost:5082"]);
  assert.equal(plan[1].args.at(-2), "58408");
  assert.equal(plan[1].env.VITE_API_BASE_URL, "http://localhost:5082/api");
});

test("service plan rejects invalid port configuration", () => {
  assert.throws(
    () => createServicePlan({ root: "/repo", platform: "linux", env: { AURA_API_PORT: "70000" } }),
    /AURA_API_PORT must be a port number/,
  );
});

test("development plan moves off an occupied default API port and keeps the UI aligned", async () => {
  const occupiedPort = await findAvailablePort(5200);
  const blocker = await import("node:net").then(({ default: net }) => new Promise(resolve => {
    const server = net.createServer().listen(occupiedPort, "127.0.0.1", () => resolve(server));
  }));
  try {
    const plan = await createDevelopmentPlan({ root: "/repo", platform: "linux", env: {}, defaultPort: occupiedPort });
    const apiUrl = plan[1].env.VITE_API_BASE_URL.replace(/\/api$/, "");
    assert.equal(plan[0].args.at(-1), apiUrl);
    assert.notEqual(plan[1].env.VITE_API_BASE_URL, `http://localhost:${occupiedPort}/api`);
    assert.match(plan[0].notice, /AURA_API_PORT is busy/);
  } finally {
    await new Promise(resolve => blocker.close(resolve));
  }
});

test("explicitly configured occupied API ports fail with recovery guidance", async () => {
  const occupiedPort = await findAvailablePort(5220);
  const blocker = await import("node:net").then(({ default: net }) => new Promise(resolve => {
    const server = net.createServer().listen(occupiedPort, "127.0.0.1", () => resolve(server));
  }));
  try {
    await assert.rejects(
      () => createDevelopmentPlan({ root: "/repo", platform: "linux", env: { AURA_API_PORT: String(occupiedPort) } }),
      new RegExp(`AURA_API_PORT ${occupiedPort} is already in use`),
    );
  } finally {
    await new Promise(resolve => blocker.close(resolve));
  }
});

test("service plan preserves explicit API URL configuration", () => {
  const plan = createServicePlan({ root: "/repo", platform: "win32", env: { VITE_API_BASE_URL: "http://localhost:6000/api" } });

  assert.equal(plan[1].command, "npm.cmd");
  assert.equal(plan[1].env.VITE_API_BASE_URL, "http://localhost:6000/api");
});

test("combined launcher selects its API port and warns when .env.local points elsewhere", () => {
  const root = mkdtempSync(join(tmpdir(), "aura-dev-plan-"));
  mkdirSync(join(root, "aura-ui"), { recursive: true });
  writeFileSync(join(root, "aura-ui", ".env.local"), "VITE_API_BASE_URL=http://localhost:6000/api\n");

  try {
    const plan = createServicePlan({ root, platform: "linux", env: {} });
    assert.equal(plan[1].env.VITE_API_BASE_URL, "http://localhost:5082/api");
    assert.match(plan[1].notice, /\.env\.local.*http:\/\/localhost:6000\/api.*http:\/\/localhost:5082\/api/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("exported API URL explicitly overrides the combined launch default and local file", () => {
  const root = mkdtempSync(join(tmpdir(), "aura-dev-plan-"));
  mkdirSync(join(root, "aura-ui"), { recursive: true });
  writeFileSync(join(root, "aura-ui", ".env.local"), "VITE_API_BASE_URL=http://localhost:6000/api\n");

  try {
    const plan = createServicePlan({ root, platform: "linux", env: { VITE_API_BASE_URL: "http://localhost:6001/api" } });
    assert.equal(plan[1].env.VITE_API_BASE_URL, "http://localhost:6001/api");
    assert.equal(plan[1].notice, undefined);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a child startup failure stops both services and returns failure", async () => {
  const children = [new FakeChild(1), new FakeChild(2)];
  let nextChild = 0;
  const stopped = [];
  const signalSource = new EventEmitter();
  const run = runDevelopment({
    plan: [{ name: "API" }, { name: "UI" }],
    spawnProcess: () => children[nextChild++],
    signalSource,
    log: () => {},
    stop: async child => {
      stopped.push(child.pid);
      child.exitCode = 1;
    },
  });

  children[0].emit("error", new Error("dotnet is missing"));

  assert.equal(await run, 1);
  assert.deepEqual(stopped, [1, 2]);
  assert.equal(signalSource.listenerCount("SIGINT"), 0);
});

test("an unexpected child exit stops its sibling and returns failure", async () => {
  const children = [new FakeChild(1), new FakeChild(2)];
  let nextChild = 0;
  const stopped = [];
  const run = runDevelopment({
    plan: [{ name: "API" }, { name: "UI" }],
    spawnProcess: () => children[nextChild++],
    signalSource: new EventEmitter(),
    log: () => {},
    stop: async child => {
      stopped.push(child.pid);
      child.exitCode = 0;
    },
  });

  children[0].emit("exit", 0, null);

  assert.equal(await run, 1);
  assert.deepEqual(stopped, [1, 2]);
});

test("Ctrl+C coordinates shutdown and returns the conventional interrupt code", async () => {
  const children = [new FakeChild(1), new FakeChild(2)];
  let nextChild = 0;
  const stopped = [];
  const signalSource = new EventEmitter();
  const run = runDevelopment({
    plan: [{ name: "API" }, { name: "UI" }],
    spawnProcess: () => children[nextChild++],
    signalSource,
    log: () => {},
    stop: async child => {
      stopped.push(child.pid);
      child.exitCode = 0;
    },
  });

  signalSource.emit("SIGINT");

  assert.equal(await run, 130);
  assert.deepEqual(stopped, [1, 2]);
  assert.equal(signalSource.listenerCount("SIGTERM"), 0);
});

test("POSIX shutdown signals the detached service process group", () => {
  const signals = [];

  terminateProcessTree(new FakeChild(42), "darwin", () => assert.fail("unexpected helper process"), (pid, signal) => {
    signals.push([pid, signal]);
  });

  assert.deepEqual(signals, [[-42, "SIGTERM"]]);
});

test("Windows shutdown uses taskkill recursively for the child process tree", () => {
  const killer = new FakeChild(99);
  const invocations = [];

  terminateProcessTree(new FakeChild(42), "win32", (command, args, options) => {
    invocations.push([command, args, options]);
    return killer;
  });

  assert.equal(invocations[0][0], "taskkill");
  assert.deepEqual(invocations[0][1], ["/pid", "42", "/T", "/F"]);
});
