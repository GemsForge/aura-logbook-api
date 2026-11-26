import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import net from "node:net";
import { createDevControlServer, readDevTestClients } from "./dev-control.mjs";
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

/** Reads only the supported backend credential from its Git-ignored file, without changing process.env. */
function localFreeAstroApiKey(root) {
  const path = resolve(root, "AuraLogbook.Api", ".env.local");
  if (!existsSync(path)) return undefined;
  const match = readFileSync(path, "utf8").match(/^\s*FREE_ASTRO_API_KEY\s*=\s*(.*?)\s*$/m);
  return match?.[1].replace(/^(?:"(.*)"|'(.*)')$/, (_, doubleQuoted, singleQuoted) => doubleQuoted ?? singleQuoted);
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

/** Builds API/UI startup settings while keeping local provider credentials in the API environment only. */
export function createServicePlan({ root = repositoryRoot, platform = process.platform, env = process.env, apiPort } = {}) {
  const apiRoot = resolve(root, "AuraLogbook.Api");
  const uiRoot = resolve(root, "aura-ui");
  const apiConfiguration = apiPortConfiguration(root, env, 5082);
  const uiPort = configuredPort(env.AURA_UI_PORT, 58407, "AURA_UI_PORT");
  const uiEnv = { ...env };
  // The local key belongs only to the API child; never pass it to Vite's environment.
  const apiEnv = { ...env };
  for (const key of ["AURA_DEV_TEST_CLIENTS", "AURA_DEV_TEST_CLIENTS_JSON", "AURA_DEV_CONTROL_TARGET"]) {
    delete uiEnv[key];
    delete apiEnv[key];
  }
  // Keep API/database/provider secrets out of the Vite child environment, even when exported by the launcher caller.
  const privateEnvironmentKey = /(?:SECRET|PASSWORD|TOKEN|API_KEY|(?:^|__)KEY$|CONNECTION_STRING|CONNECTIONSTRING|PRIVATE.*PATH)/i;
  for (const key of Object.keys(uiEnv)) {
    if (privateEnvironmentKey.test(key)) delete uiEnv[key];
  }
  const freeAstroKey = env.FREE_ASTRO_API_KEY || localFreeAstroApiKey(root);
  if (freeAstroKey) apiEnv.FREE_ASTRO_API_KEY = freeAstroKey;
  delete uiEnv.FREE_ASTRO_API_KEY;
  delete uiEnv.FreeAstroApi__ApiKey;
  const apiEnvironmentAlias = String(env.AURA_ENV || env.ASPNETCORE_ENVIRONMENT || "DEV").trim().toUpperCase();
  const apiEnvironment = resolveApiEnvironment(env.AURA_ENV || env.ASPNETCORE_ENVIRONMENT || "DEV");
  const selectedApiPort = apiPort ?? apiConfiguration.apiPort;
  const defaultApiUrl = `http://localhost:${selectedApiPort}/api`;
  uiEnv.VITE_API_BASE_URL = apiConfiguration.configuredUiApiPort === undefined
    ? (env.VITE_API_BASE_URL || defaultApiUrl)
    : apiPort !== undefined && apiPort !== apiConfiguration.apiPort
      ? defaultApiUrl
      : (apiConfiguration.configuredUiApiUrl || defaultApiUrl);

  // Ignore launchSettings.json environment overrides so DEV/FIT/PRO selected above reaches ASP.NET Core.
  const apiArgs = ["run", "--project", "AuraLogbook.Api.csproj", "--no-launch-profile"];
  apiArgs.push("--", "--urls", `http://localhost:${selectedApiPort}`);

  const controlPort = configuredPort(env.AURA_DEV_CONTROL_PORT, uiPort === 65535 ? 58408 : uiPort + 1, "AURA_DEV_CONTROL_PORT");
  let localApi = true;
  if (apiConfiguration.configuredUiApiUrl) {
    try {
      const configuredApiUrl = new URL(apiConfiguration.configuredUiApiUrl);
      localApi = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(configuredApiUrl.hostname);
    } catch {
      localApi = apiConfiguration.configuredUiApiUrl.startsWith("/");
      if (localApi && env.AURA_API_PROXY_TARGET) {
        try {
          const proxyTarget = new URL(env.AURA_API_PROXY_TARGET);
          localApi = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(proxyTarget.hostname);
        } catch {
          localApi = false;
        }
      }
    }
  }
  const enableDeveloperToolbar = localApi && apiEnvironmentAlias !== "PRO" && apiEnvironment !== "Production";
  if (enableDeveloperToolbar && [uiPort, selectedApiPort].includes(controlPort)) {
    throw new Error("AURA_DEV_CONTROL_PORT must differ from AURA_UI_PORT and AURA_API_PORT.");
  }
  uiEnv.VITE_AURA_DEV_TOOLBAR = enableDeveloperToolbar ? "true" : "false";
  uiEnv.VITE_AURA_ENV = apiEnvironmentAlias === "FIT" ? "FIT" : apiEnvironmentAlias === "PRO" || apiEnvironment === "Production" ? "PRO" : "DEV";
  if (enableDeveloperToolbar) {
    uiEnv.AURA_DEV_CONTROL_TARGET = `http://127.0.0.1:${controlPort}`;
    if (uiEnv.VITE_API_BASE_URL.startsWith("/")) {
      uiEnv.AURA_API_PROXY_TARGET = env.AURA_API_PROXY_TARGET || `http://127.0.0.1:${selectedApiPort}`;
    }
  }
  else delete uiEnv.AURA_DEV_CONTROL_TARGET;

  return [
    {
      name: "API",
      command: "dotnet",
      args: apiArgs,
      cwd: apiRoot,
      env: { ...apiEnv, ASPNETCORE_ENVIRONMENT: apiEnvironment },
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
  // OAuth callbacks use a registered port; silently moving the API splits one login across processes.
  if (selectedPort !== requestedPort) {
    const source = env.AURA_API_PORT ? `AURA_API_PORT ${requestedPort}` : apiConfiguration.configuredUiApiPort !== undefined ? `local VITE_API_BASE_URL port ${requestedPort}` : `default API port ${requestedPort}`;
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

function processGroupExists(pid, killProcess = process.kill) {
  try {
    killProcess(-pid, 0);
    return true;
  } catch (error) {
    if (error?.code === "ESRCH") return false;
    return true;
  }
}

export function stopChild(child, platform, spawnProcess, killProcess = process.kill, {
  gracePeriodMs = 5000,
  pollIntervalMs = 50,
  groupExists = processGroupExists,
} = {}) {
  if (child.pid === undefined || child.pid === null) return Promise.resolve();

  if (platform === "win32") {
    const terminate = () => {
      const killer = spawnProcess("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
      killer.on("error", () => {});
    };
    const alreadyExited = child.exitCode !== null || child.signalCode !== null;
    if (alreadyExited) {
      terminate();
      return Promise.resolve();
    }

    return new Promise(resolveStop => {
      let forceTimer;
      const finish = () => {
        clearTimeout(forceTimer);
        resolveStop();
      };
      child.once("close", finish);
      terminate();
      forceTimer = setTimeout(terminate, gracePeriodMs);
      forceTimer.unref();
    });
  }

  try {
    killProcess(-child.pid, "SIGTERM");
  } catch (error) {
    if (error?.code !== "ESRCH") child.kill("SIGTERM");
  }

  return new Promise(resolveStop => {
    let finished = false;
    let forceTimer;
    let pollTimer;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(forceTimer);
      clearTimeout(pollTimer);
      resolveStop();
    };
    const checkGroup = () => {
      if (!groupExists(child.pid, killProcess)) {
        finish();
        return;
      }
      pollTimer = setTimeout(checkGroup, pollIntervalMs);
    };

    forceTimer = setTimeout(() => {
      try {
        killProcess(-child.pid, "SIGKILL");
      } catch (error) {
        if (error?.code !== "ESRCH") child.kill("SIGKILL");
      }
      checkGroup();
    }, gracePeriodMs);
    checkGroup();
  });
}

export function runDevelopment({
  spawnProcess = spawn,
  platform = process.platform,
  signalSource = process,
  log = message => console.log(message),
  plan = createServicePlan({ platform }),
  stop = stopChild,
  control = null,
} = {}) {
  const children = new Map();
  let stopping = false;
  let resolveRun;
  let exitCode = 0;
  let stopPromise;
  let apiState = "stopped";
  let apiFailure = false;
  let controlServer;
  let apiActionQueue = Promise.resolve();

  const apiService = plan.find(service => service.name === "API");
  const otherServices = plan.filter(service => service.name !== "API");

  const serializeApiAction = action => {
    apiActionQueue = apiActionQueue.then(action, action);
    return apiActionQueue;
  };

  const startApi = () => serializeApiAction(async () => {
    if (stopping) return;
    if (!apiService) throw new Error("The local API launcher is not configured.");
    if (children.has("API")) return;
    apiState = "starting";
    apiFailure = false;
    const child = spawnService(apiService, true);
    if (!child) {
      apiState = "failed";
      apiFailure = true;
      return;
    }
    children.set("API", child);
    apiState = "running";
  });

  const stopApi = () => serializeApiAction(async () => {
    const child = children.get("API");
    if (!child) {
      apiState = "stopped";
      apiFailure = false;
      return;
    }
    apiState = "stopping";
    children.delete("API");
    await stop(child, platform, spawnProcess);
    apiState = "stopped";
    apiFailure = false;
  });

  const restartApi = () => serializeApiAction(async () => {
    if (stopping) return;
    if (!apiService) throw new Error("The local API launcher is not configured.");
    const child = children.get("API");
    if (child) {
      apiState = "stopping";
      children.delete("API");
      await stop(child, platform, spawnProcess);
    }
    apiState = "starting";
    apiFailure = false;
    const next = spawnService(apiService, true);
    if (!next) {
      apiState = "failed";
      apiFailure = true;
      return;
    }
    children.set("API", next);
    apiState = "running";
  });

  const result = new Promise(resolveResult => {
    resolveRun = resolveResult;
  });

  const stopAll = code => {
    if (stopPromise) return stopPromise;
    stopping = true;
    exitCode = code;
    removeSignals();
    if (controlServer?.listening) controlServer.close();
    stopPromise = Promise.all([...children.values()].map(child => stop(child, platform, spawnProcess)))
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

  function spawnService(service, managedApi = false) {
      if (service.notice) log(`[${service.name}] ${service.notice}`);
      let child;
      try {
        child = spawnProcess(service.command, service.args, {
        cwd: service.cwd,
        env: service.env,
        stdio: ["inherit", "pipe", "pipe"],
        detached: platform !== "win32",
        shell: platform === "win32",
        windowsHide: true,
      });
      } catch (error) {
        log(`[${service.name}] Could not start: ${error.message}`);
        if (managedApi) {
          apiState = "failed";
          apiFailure = true;
          return null;
        }
        throw error;
      }
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
        if (managedApi && !stopping) {
          child.__startError = true;
          apiState = "failed";
          apiFailure = true;
          children.delete("API");
        } else {
          void stopAll(1);
        }
      });
      child.once("exit", (code, signal) => {
        if (stopping) return;
        if (managedApi) {
          if (!["stopping", "stopped"].includes(apiState)) {
            children.delete("API");
            apiState = "failed";
            apiFailure = true;
            log(`[${service.name}] exited unexpectedly (${signal ?? `code ${code}`}); use the developer toolbar to restart it.`);
          }
          return;
        }
        log(`[${service.name}] exited unexpectedly (${signal ?? `code ${code}`}); stopping both services.`);
        void stopAll(code && code > 0 ? code : 1);
      });
      return child;
  }

  try {
    if (control) {
      controlServer = createDevControlServer({
        lifecycle: {
          start: startApi,
          stop: stopApi,
          restart: restartApi,
          status: () => ({ state: apiState, failed: apiFailure }),
        },
        ...control,
      });
      controlServer.listen(control.controlPort, "127.0.0.1", () => {
        log(`[DEV] Toolbar companion listening on http://127.0.0.1:${control.controlPort}`);
      });
      controlServer.on("error", error => log(`[DEV] Toolbar companion unavailable: ${error.message}`));
      void startApi();
      for (const service of otherServices) {
        const child = spawnService(service);
        children.set(service.name, child);
      }
    } else {
      for (const service of plan) {
        const child = spawnService(service);
        children.set(service.name, child);
      }
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
    const plan = await createDevelopmentPlan();
    const [apiService, uiService] = plan;
    const controlEnabled = uiService.env.VITE_AURA_DEV_TOOLBAR === "true";
    const uiPort = configuredPort(process.env.AURA_UI_PORT, 58407, "AURA_UI_PORT");
    const controlPort = configuredPort(process.env.AURA_DEV_CONTROL_PORT, uiPort === 65535 ? 58408 : uiPort + 1, "AURA_DEV_CONTROL_PORT");
    const testClients = readDevTestClients(repositoryRoot);
    const apiOrigin = new URL(apiService.args.at(-1)).origin;
    exitCode = await runDevelopment({
      plan,
      control: controlEnabled ? {
        apiBaseUrl: `${apiOrigin}/api`,
        uiPort,
        controlPort,
        clients: testClients.clients,
        configurationError: testClients.error,
      } : null,
    });
  } catch (error) {
    console.error(`[API] ${error.message}`);
    exitCode = 1;
  }
  process.exitCode = exitCode;
}
