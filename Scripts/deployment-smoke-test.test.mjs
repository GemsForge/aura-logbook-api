import test from "node:test";
import assert from "node:assert/strict";
import { runDeploymentSmokeCheck } from "./deployment-smoke-test.mjs";

const healthyResponse = () => ({ status: 200, json: async () => ({ status: "healthy" }) });

test("retries a cold API start, then checks health and the UI root", async () => {
  const requests = [];
  let healthAttempts = 0;
  const result = await runDeploymentSmokeCheck({
    apiUrl: "https://api.example.test",
    uiUrl: "https://app.example.test",
    attempts: 3,
    retryDelayMs: 0,
    wait: async () => {},
    fetchImpl: async (url) => {
      requests.push(url.toString());
      if (url.pathname === "/health/database") {
        healthAttempts += 1;
        return healthAttempts === 1 ? { status: 503 } : healthyResponse();
      }
      return { status: 200 };
    },
  });

  assert.deepEqual(result, { api: "healthy", ui: "200" });
  assert.equal(healthAttempts, 2);
  assert.deepEqual(requests, [
    "https://api.example.test/health/database",
    "https://api.example.test/health/database",
    "https://app.example.test/",
  ]);
});

test("fails when the health endpoint reports an unhealthy service", async () => {
  await assert.rejects(
    runDeploymentSmokeCheck({
      apiUrl: "https://api.example.test",
      uiUrl: "https://app.example.test",
      fetchImpl: async () => ({ status: 200, json: async () => ({ status: "degraded" }) }),
      wait: async () => {},
    }),
    /did not report healthy status/,
  );
});

test("retries transient API errors and then fails", async () => {
  let attempts = 0;
  await assert.rejects(
    runDeploymentSmokeCheck({
      apiUrl: "https://api.example.test",
      uiUrl: "https://app.example.test",
      attempts: 2,
      retryDelayMs: 0,
      wait: async () => {},
      fetchImpl: async () => { attempts += 1; return { status: 503 }; },
    }),
    /HTTP 503/,
  );
  assert.equal(attempts, 2);
});

test("fails when the UI root does not return HTTP 200", async () => {
  await assert.rejects(
    runDeploymentSmokeCheck({
      apiUrl: "https://api.example.test",
      uiUrl: "https://app.example.test",
      fetchImpl: async (url) => url.pathname === "/health/database"
        ? healthyResponse()
        : { status: 500 },
      wait: async () => {},
    }),
    /UI smoke check failed with HTTP 500/,
  );
});

test("rejects URLs that could hide a different host or endpoint path", async () => {
  await assert.rejects(
    runDeploymentSmokeCheck({
      apiUrl: "https://api.example.test/another-path",
      uiUrl: "https://app.example.test",
      fetchImpl: async () => healthyResponse(),
    }),
    /apiUrl must be an absolute HTTP or HTTPS origin/,
  );
});
