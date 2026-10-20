import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import net from "node:net";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function configuredPort(value, fallback, name) {
  if (value === undefined || value === "") return fallback;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${name} must be a port number from 1 to 65535.`);
  }
  return port;
}

function localApiBaseUrl(path) {
  if (!existsSync(path)) return undefined;
  const match = readFileSync(path, "utf8").match(/^\s*VITE_API_BASE_URL\s*=\s*(.*?)\s*$/m);
  if (!match) return undefined;
  return match[1].replace(/^(?:"(.*)"|'(.*)')$/, (_, doubleQuoted, singleQuoted) => doubleQuoted ?? singleQuoted);
}

function localApiPort(apiUrl, source) {
  if (!apiUrl) return undefined;
  let parsed;
  try {
    parsed = new URL(apiUrl);
  } catch {
    throw new Error(`${source} must be a valid API URL.`);
  }

  if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(parsed.hostname)) return undefined;
  if (parsed.protocol !== "http:") {
    throw new Error(`${source} points to a local API but must use http:// for the combined development launcher.`);
  }
  if (!parsed.port) {
    throw new Error(`${source} points to a local API but has no port; set AURA_API_PORT and include the same port in VITE_API_BASE_URL.`);
  }
  return configuredPort(parsed.port, undefined, source);
}

function apiPortConfiguration(root, env, defaultPort) {
  const fileApiUrl = localApiBaseUrl(resolve(root, "aura-ui", ".env.local"));
  const configuredUiApiUrl = env.VITE_API_BASE_URL || fileApiUrl;
  const configuredUiApiPort = localApiPort(configuredUiApiUrl, env.VITE_API_BASE_URL ? "VITE_API_BASE_URL" : "aura-ui/.env.local VITE_API_BASE_URL");
  const explicitApiPort = env.AURA_API_PORT !== undefined && env.AURA_API_PORT !== "";
  const apiPort = configuredPort(env.AURA_API_PORT, defaultPort, "AURA_API_PORT");
  if (explicitApiPort && configuredUiApiPort !== undefined && configuredUiApiPort !== apiPort) {
    throw new Error(`AURA_API_PORT ${apiPort} conflicts with local VITE_API_BASE_URL port ${configuredUiApiPort}. Set both to the same port, or remove the local VITE_API_BASE_URL override.`);
  }

  return {
    apiPort: explicitApiPort ? apiPort : configuredUiApiPort ?? apiPort,
    configuredUiApiUrl,
    configuredUiApiPort,
    explicitPort: explicitApiPort || configuredUiApiPort !== undefined,
  };
}

export function resolveApiEnvironment(value = "DEV") {
  const aliases = {
    DEV: "Development",
    FIT: "Staging",
    PRO: "Production",
  };
  const normalized = String(value).trim().toUpperCase();
  return aliases[normalized] ?? value;
}

export function createServicePlan({ root = repositoryRoot, platform = process.platform, env = process.env, apiPort } = {}) {
  const apiRoot = resolve(root, "AuraLogbook.Api");
  const uiRoot = resolve(root, "aura-ui");
  const apiConfiguration = apiPortConfiguration(root, env, 5082);
  const uiPort = configuredPort(env.AURA_UI_PORT, 58407, "AURA_UI_PORT");
  const uiEnv = { ...env };
  const apiEnvironment = resolveApiEnvironment(env.AURA_ENV || env.ASPNETCORE_ENVIRONMENT || "DEV");
  const selectedApiPort = apiPort ?? apiConfiguration.apiPort;
  const defaultApiUrl = `http://localhost:${selectedApiPort}/api`;
  uiEnv.VITE_API_BASE_URL = apiConfiguration.configuredUiApiPort === undefined
    ? (env.VITE_API_BASE_URL || defaultApiUrl)
    : apiPort !== undefined && apiPort !== apiConfiguration.apiPort
      ? defaultApiUrl
      : (apiConfiguration.configuredUiApiUrl || defaultApiUrl);

  const apiArgs = ["run", "--project", "AuraLogbook.Api.csproj", "--launch-profile", "http"];
  apiArgs.push("--", "--urls", `http://localhost:${selectedApiPort}`);

  return [
    {
      name: "API",
      command: "dotnet",
      args: apiArgs,
      cwd: apiRoot,
      env: { ...env, ASPNETCORE_ENVIRONMENT: apiEnvironment },
      ...(apiPort !== undefined && apiPort !== apiConfiguration.apiPort
        ? { notice: `AURA_API_PORT is busy; using available API port ${apiPort}.` }
        : {}),
    },
    {
      name: "UI",
      command: platform === "win32" ? "npm.cmd" : "npm",
      args: ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(uiPort), "--strictPort"],
      cwd: uiRoot,
      env: uiEnv,
      notice: undefined,
    },
  ];
}

function canListen(port, host = "127.0.0.1") {
  return new Promise(resolveResult => {
    const server = net.createServer();
    server.once("error", () => resolveResult(false));
    server.once("listening", () => server.close(() => resolveResult(true)));
    server.listen(port, host);
  });
}

export async function findAvailablePort(startPort, { host = "127.0.0.1", attempts = 20 } = {}) {
  for (let offset = 0; offset < attempts; offset += 1) {
    const port = startPort + offset;
    if (port > 65535) break;
    if (await canListen(port, host)) return port;
  }
  throw new Error(`No available API port found between ${startPort} and ${startPort + attempts - 1}. Set AURA_API_PORT explicitly.`);
}

export async function createDevelopmentPlan({ root = repositoryRoot, platform = process.platform, env = process.env, defaultPort = 5082 } = {}) {
  const apiConfiguration = apiPortConfiguration(root, env, defaultPort);
  const requestedPort = apiConfiguration.apiPort;
  const selectedPort = await findAvailablePort(requestedPort);
  if (apiConfiguration.explicitPort && selectedPort !== requestedPort) {
    const source = env.AURA_API_PORT ? `AURA_API_PORT ${requestedPort}` : `local VITE_API_BASE_URL port ${requestedPort}`;
    throw new Error(`${source} is already in use. Stop the process using port ${requestedPort} or choose another port by updating ${env.AURA_API_PORT ? "AURA_API_PORT" : "VITE_API_BASE_URL"}. The launcher will not stop unrelated listeners.`);
  }
  return createServicePlan({ root, platform, env, apiPort: selectedPort });
}

function writePrefixed(prefix, stream, chunk, pending) {
  const lines = (pending.value + chunk.toString()).split("\n");
  pending.value = lines.pop() ?? "";
  for (const line of lines) stream.write(`[${prefix}] ${line.replace(/\r$/, "")}\n`);
}

function finishPrefixed(prefix, stream, pending) {
  if (pending.value) stream.write(`[${prefix}] ${pending.value.replace(/\r$/, "")}\n`);
}

export function terminateProcessTree(child, platform, spawnProcess, killProcess = process.kill) {
  if (child.pid === undefined || child.pid === null) return;

  if (platform === "win32") {
    const killer = spawnProcess("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true,
    });
    killer.on("error", () => {});
    return;
  }

  try {
    killProcess(-child.pid, "SIGTERM");
  } catch (error) {
    if (error?.code !== "ESRCH") child.kill("SIGTERM");
  }
}

function stopChild(child, platform, spawnProcess, killProcess = process.kill) {
  const alreadyExited = child.exitCode !== null || child.signalCode !== null;
  if (alreadyExited) {
    if (platform !== "win32" && child.pid !== undefined && child.pid !== null) {
      try {
        killProcess(-child.pid, "SIGTERM");
      } catch (error) {
        if (error?.code !== "ESRCH") throw error;
      }
    }
    return Promise.resolve();
  }

  return new Promise(resolveStop => {
    let finished = false;
    let forceTimer;
    const finish = () => {
      if (finished) return;
      finished = true;
      if (forceTimer) clearTimeout(forceTimer);
      resolveStop();
    };
    child.once("close", finish);
    terminateProcessTree(child, platform, spawnProcess, killProcess);

    forceTimer = setTimeout(() => {
      if (platform === "win32") {
        const killer = spawnProcess("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
          stdio: "ignore",
          windowsHide: true,
        });
        killer.on("error", () => {});
      } else {
        try {
          killProcess(-child.pid, "SIGKILL");
        } catch (error) {
          if (error?.code !== "ESRCH") child.kill("SIGKILL");
        }
      }
    }, 5000);
    forceTimer.unref();
  });
}

export function runDevelopment({
  spawnProcess = spawn,
  platform = process.platform,
  signalSource = process,
  log = message => console.log(message),
  plan = createServicePlan({ platform }),
  stop = stopChild,
} = {}) {
  const children = [];
  let stopping = false;
  let resolveRun;
  let exitCode = 0;
  let stopPromise;

  const result = new Promise(resolveResult => {
    resolveRun = resolveResult;
  });

  const stopAll = code => {
    if (stopPromise) return stopPromise;
    stopping = true;
    exitCode = code;
    removeSignals();
    stopPromise = Promise.all(children.map(child => stop(child, platform, spawnProcess)))
      .then(() => resolveRun(exitCode));
    return stopPromise;
  };

  const onInterrupt = () => {
    log("Stopping API and UI...");
    void stopAll(130);
  };
  const onTerminate = () => {
    log("Stopping API and UI...");
    void stopAll(143);
  };
  const removeSignals = () => {
    signalSource.removeListener("SIGINT", onInterrupt);
    signalSource.removeListener("SIGTERM", onTerminate);
  };

  signalSource.on("SIGINT", onInterrupt);
  signalSource.on("SIGTERM", onTerminate);

  try {
    for (const service of plan) {
      if (service.notice) log(`[${service.name}] ${service.notice}`);
      const child = spawnProcess(service.command, service.args, {
        cwd: service.cwd,
        env: service.env,
        stdio: ["inherit", "pipe", "pipe"],
        detached: platform !== "win32",
        shell: platform === "win32",
        windowsHide: true,
      });
      children.push(child);
      const stdoutPending = { value: "" };
      const stderrPending = { value: "" };
      child.stdout?.on("data", chunk => writePrefixed(service.name, process.stdout, chunk, stdoutPending));
      child.stderr?.on("data", chunk => writePrefixed(service.name, process.stderr, chunk, stderrPending));
      child.once("close", () => {
        finishPrefixed(service.name, process.stdout, stdoutPending);
        finishPrefixed(service.name, process.stderr, stderrPending);
      });
      child.once("error", error => {
        log(`[${service.name}] Could not start: ${error.message}`);
        void stopAll(1);
      });
      child.once("exit", (code, signal) => {
        if (stopping) return;
        log(`[${service.name}] exited unexpectedly (${signal ?? `code ${code}`}); stopping both services.`);
        void stopAll(code && code > 0 ? code : 1);
      });
    }
  } catch (error) {
    log(`Could not start development services: ${error.message}`);
    void stopAll(1);
  }

  return result;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  let exitCode;
  try {
    exitCode = await runDevelopment({ plan: await createDevelopmentPlan() });
  } catch (error) {
    console.error(`[API] ${error.message}`);
    exitCode = 1;
  }
  process.exitCode = exitCode;
}
