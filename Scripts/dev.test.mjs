import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createServicePlan, runDevelopment, terminateProcessTree } from "./dev.mjs";

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

test("service plan preserves explicit API URL configuration", () => {
  const plan = createServicePlan({ root: "/repo", platform: "win32", env: { VITE_API_BASE_URL: "http://localhost:6000/api" } });

  assert.equal(plan[1].command, "npm.cmd");
  assert.equal(plan[1].env.VITE_API_BASE_URL, "http://localhost:6000/api");
});

test("service plan leaves a configured .env.local API URL for Vite to load", () => {
  const root = mkdtempSync(join(tmpdir(), "aura-dev-plan-"));
  mkdirSync(join(root, "aura-ui"), { recursive: true });
  writeFileSync(join(root, "aura-ui", ".env.local"), "VITE_API_BASE_URL=http://localhost:6000/api\n");

  try {
    const plan = createServicePlan({ root, platform: "linux", env: {} });
    assert.equal(plan[1].env.VITE_API_BASE_URL, undefined);
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
