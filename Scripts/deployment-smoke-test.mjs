#!/usr/bin/env node
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
const REQUEST_TIMEOUT_MS = 10_000;
const DEFAULT_ATTEMPTS = 12;
const DEFAULT_RETRY_DELAY_MS = 10_000;

function getOrigin(value, name) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute HTTP or HTTPS origin.`);
  }

  if (!new Set(["http:", "https:"]).has(url.protocol)
    || !url.hostname
    || url.username
    || url.password
    || url.pathname !== "/"
    || url.search
    || url.hash) {
    throw new Error(`${name} must be an absolute HTTP or HTTPS origin without credentials, path, query, or fragment.`);
  }

  return url.origin;
}

/** Checks deployed API readiness with cold-start retries, then confirms the UI root returns HTTP 200. */
export async function runDeploymentSmokeCheck({
  apiUrl,
  uiUrl,
  fetchImpl = globalThis.fetch,
  attempts = DEFAULT_ATTEMPTS,
  retryDelayMs = DEFAULT_RETRY_DELAY_MS,
  wait = (milliseconds) => new Promise((resolveWait) => setTimeout(resolveWait, milliseconds)),
}) {
  if (!Number.isInteger(attempts) || attempts < 1) throw new Error("attempts must be a positive integer.");
  if (!Number.isFinite(retryDelayMs) || retryDelayMs < 0) throw new Error("retryDelayMs must be non-negative.");
  if (typeof fetchImpl !== "function") throw new Error("A fetch implementation is required.");

  const healthUrl = new URL("/health/database", getOrigin(apiUrl, "apiUrl"));
  const uiRootUrl = new URL("/", getOrigin(uiUrl, "uiUrl"));
  let healthy = false;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let response;
    try {
      response = await fetchImpl(healthUrl, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch {
      if (attempt === attempts) throw new Error(`API health check did not succeed after ${attempts} attempts.`);
      await wait(retryDelayMs);
      continue;
    }

    if (response.status === 200) {
      let health;
      try {
        health = await response.json();
      } catch {
        throw new Error("API health check returned invalid JSON.");
      }
      if (health?.status !== "healthy") {
        throw new Error("API health check did not report healthy status.");
      }
      healthy = true;
      break;
    }

    if (!RETRYABLE_STATUSES.has(response.status) || attempt === attempts) {
      throw new Error(`API health check failed with HTTP ${response.status}.`);
    }
    await wait(retryDelayMs);
  }

  if (!healthy) throw new Error(`API health check did not succeed after ${attempts} attempts.`);

  let uiResponse;
  try {
    uiResponse = await fetchImpl(uiRootUrl, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch {
    throw new Error("UI smoke check could not reach the site root.");
  }
  if (uiResponse.status !== 200) throw new Error(`UI smoke check failed with HTTP ${uiResponse.status}.`);

  return { api: "healthy", ui: "200" };
}

async function main() {
  const result = await runDeploymentSmokeCheck({
    apiUrl: process.env.AURA_SMOKE_API_URL,
    uiUrl: process.env.AURA_SMOKE_UI_URL,
  });
  console.log(`Deployment smoke check passed: API ${result.api}; UI HTTP ${result.ui}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`Deployment smoke check failed: ${error.message}`);
    process.exitCode = 1;
  });
}
