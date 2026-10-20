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
  const configuredApiPort = configuredPort(env.AURA_API_PORT, 5082, "AURA_API_PORT");
  const uiPort = configuredPort(env.AURA_UI_PORT, 58407, "AURA_UI_PORT");
  const uiEnv = { ...env };
  const apiEnvironment = resolveApiEnvironment(env.AURA_ENV || env.ASPNETCORE_ENVIRONMENT || "DEV");
  const localApiUrl = localApiBaseUrl(resolve(uiRoot, ".env.local"));
  const selectedApiPort = apiPort ?? configuredApiPort;
  const defaultApiUrl = `http://localhost:${selectedApiPort}/api`;
  uiEnv.VITE_API_BASE_URL = env.VITE_API_BASE_URL || defaultApiUrl;

  const apiArgs = ["run", "--project", "AuraLogbook.Api.csproj", "--launch-profile", "http"];
  if (env.AURA_API_PORT || apiPort !== undefined) apiArgs.push("--", "--urls", `http://localhost:${selectedApiPort}`);

  return [
    {
      name: "API",
      command: "dotnet",
      args: apiArgs,
      cwd: apiRoot,
      env: { ...env, ASPNETCORE_ENVIRONMENT: apiEnvironment },
      ...(apiPort !== undefined && apiPort !== configuredApiPort
        ? { notice: `AURA_API_PORT is busy; using available API port ${apiPort}.` }
        : {}),
    },
    {
      name: "UI",
      command: platform === "win32" ? "npm.cmd" : "npm",
      args: ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(uiPort), "--strictPort"],
      cwd: uiRoot,
      env: uiEnv,
      notice: !env.VITE_API_BASE_URL && localApiUrl && localApiUrl !== defaultApiUrl
        ? `Ignoring aura-ui/.env.local VITE_API_BASE_URL=${localApiUrl} for the combined launch; targeting ${defaultApiUrl}. Export VITE_API_BASE_URL to override.`
        : undefined,
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
  const requestedPort = configuredPort(env.AURA_API_PORT, defaultPort, "AURA_API_PORT");
  const selectedPort = await findAvailablePort(requestedPort);
  if (env.AURA_API_PORT && selectedPort !== requestedPort) {
    throw new Error(`AURA_API_PORT ${requestedPort} is already in use. Choose another port or stop the process using it.`);
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
