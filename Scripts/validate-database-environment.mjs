#!/usr/bin/env node
// Start the API the way one deployment environment starts it, against a brand-new
// SQLite file, and prove that environment's database configuration works:
//   1. configuration loads (appsettings.<Environment>.json + environment variables),
//   2. every migration applies to an empty database,
//   3. a restart applies nothing new (migrations are idempotent),
//   4. Production refuses unsafe database settings.
// It never touches a real database: each run creates and deletes its own file.
//
// Usage: node Scripts/validate-database-environment.mjs <dev|fit|prod>
// Requires a prior `dotnet build AuraLogbook.sln --configuration Release`.
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdirSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { join, resolve } from "node:path";

const environments = { dev: "Development", fit: "Staging", prod: "Production" };
const target = process.argv[2];
const aspnet = environments[target];
if (!aspnet) {
  console.error("Usage: node Scripts/validate-database-environment.mjs <dev|fit|prod>");
  process.exit(2);
}

const repo = resolve(import.meta.dirname, "..");
const project = join(repo, "AuraLogbook.Api");
const apiDll = join(project, "bin", "Release", "net9.0", "AuraLogbook.Api.dll");
const root = join(repo, ".ci", "db-validation", target);
rmSync(root, { recursive: true, force: true });
mkdirSync(root, { recursive: true });
const port = 5180 + Object.keys(environments).indexOf(target);
// A throwaway signing key: real keys live only in each deployment's secrets.
const jwtKey = randomBytes(48).toString("base64");

function startApi(connectionString) {
  const output = [];
  // Launch the API process itself so stopping it cannot leave a dotnet-run child behind.
  const child = spawn("dotnet", [apiDll], {
    cwd: project,
    env: {
      ...process.env,
      ASPNETCORE_ENVIRONMENT: aspnet,
      ASPNETCORE_URLS: `http://127.0.0.1:${port}`,
      Database__ConnectionString: connectionString,
      Jwt__Key: jwtKey,
    },
  });
  child.stdout.on("data", (chunk) => output.push(chunk));
  child.stderr.on("data", (chunk) => output.push(chunk));
  const exited = new Promise((done) => child.on("exit", (code) => done(code)));
  return { child, exited, log: () => Buffer.concat(output).toString() };
}

/** Verifies no prior server can answer health checks on this run's port. */
async function assertPortFree() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

async function waitForHealth(api) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    const finished = await Promise.race([api.exited, new Promise((r) => setTimeout(() => r("running"), 1000))]);
    if (finished !== "running") throw new Error(`API exited with code ${finished} before it was healthy.\n${api.log()}`);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health/database`);
      if (response.ok) return await response.json();
    } catch { /* not listening yet */ }
  }
  throw new Error(`API did not become healthy within 90 s.\n${api.log()}`);
}

async function stop(api) {
  api.child.kill("SIGTERM");
  await api.exited;
}

async function run(label, connectionString) {
  await assertPortFree();
  const api = startApi(connectionString);
  try {
    const health = await waitForHealth(api);
    if (health.status !== "healthy") throw new Error(`${label}: unexpected status ${JSON.stringify(health)}`);
    if (health.environment !== aspnet) throw new Error(`${label}: started as ${health.environment}, expected ${aspnet}`);
    if (!(health.migrations > 0)) throw new Error(`${label}: no migrations were recorded`);
    console.log(`✓ ${label}: ${health.environment}, ${health.migrations} migrations recorded`);
    return health.migrations;
  } finally {
    await stop(api);
    await assertPortFree();
  }
}

const database = `Data Source=${join(root, `AuraLogbook_${target}.db`)}`;
const fresh = await run("fresh database migrated", database);
const restarted = await run("restart is idempotent", database);
if (restarted !== fresh) throw new Error(`Restart changed the migration count (${fresh} → ${restarted}).`);

if (target === "prod") {
  for (const [label, unsafe] of [
    ["missing connection string", ""],
    ["in-memory database", "Data Source=:memory:"],
    ["development database file", `Data Source=${join(root, "auralogbook-dev.db")}`],
  ]) {
    await assertPortFree();
    const api = startApi(unsafe);
    const code = await Promise.race([api.exited, new Promise((r) => setTimeout(() => r("running"), 60_000))]);
    if (code === "running") {
      await stop(api);
      throw new Error(`Production started with an unsafe database setting (${label}).`);
    }
    await assertPortFree();
    if (code === 0) throw new Error(`Production exited cleanly instead of refusing ${label}.`);
    console.log(`✓ Production refuses ${label}`);
  }
}

rmSync(root, { recursive: true, force: true });
console.log(`${target} (${aspnet}) database configuration validated.`);
