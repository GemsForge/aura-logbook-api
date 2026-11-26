import { afterEach, describe, expect, it, vi } from "vitest";
import { handleFitClients, handleFitStatus, handleFitTestLogin } from "../../../../functions/_lib/devToolbar";

const clients = [
  { id: "synthetic-a", label: "Synthetic Test Client A", email: "a@example.test", password: "private-sample-password-a" },
  { id: "synthetic-b", label: "Synthetic Test Client B", email: "b@example.test", password: "private-sample-password-b" },
];
const env = {
  AURA_ENV: "FIT",
  AURA_DEV_TOOLBAR_ENABLED: "true",
  API_TUNNEL_URL: "https://fit-api.example.test",
  ACCESS_SERVICE_TOKEN_CLIENT_ID: "server-side-client-id",
  ACCESS_SERVICE_TOKEN_CLIENT_SECRET: "server-side-client-secret",
  AURA_DEV_TEST_CLIENTS_JSON: JSON.stringify({ clients }),
};

afterEach(() => vi.unstubAllGlobals());

describe("Cloudflare FIT developer-toolbar functions", () => {
  it("keeps its routes absent unless explicitly enabled for FIT", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await handleFitClients({ request: new Request("https://fit-ui.example.test/__aura_dev/test-clients"), env: { ...env, AURA_ENV: "PRO" } });
    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns only configured synthetic labels and IDs", async () => {
    const response = await handleFitClients({ request: new Request("https://fit-ui.example.test/__aura_dev/test-clients"), env });
    const body = await response.text();
    expect(response.status).toBe(200);
    expect(JSON.parse(body)).toEqual({ clients: [{ id: "synthetic-a", label: "Synthetic Test Client A" }, { id: "synthetic-b", label: "Synthetic Test Client B" }] });
    expect(body).not.toMatch(/password|example\.test/);
  });

  it("fails closed when test-client configuration is missing, malformed, or not synthetic", async () => {
    const missing = await handleFitClients({ request: new Request("https://fit-ui.example.test/__aura_dev/test-clients"), env: { ...env, AURA_DEV_TEST_CLIENTS_JSON: "" } });
    expect(missing.status).toBe(503);
    const unsafe = await handleFitClients({ request: new Request("https://fit-ui.example.test/__aura_dev/test-clients"), env: { ...env, AURA_DEV_TEST_CLIENTS_JSON: JSON.stringify({ clients: [{ ...clients[0], email: "real@example.invalid" }, clients[1]] }) } });
    expect(unsafe.status).toBe(503);
    expect(await unsafe.text()).not.toContain("real@example.invalid");
  });

  it("checks FIT database health using a server-side Access identity and hides upstream details", async () => {
    const fetchMock = vi.fn(async (url: URL, init: RequestInit) => {
      expect(url.toString()).toBe("https://fit-api.example.test/health/database");
      const headers = new Headers(init.headers);
      expect(headers.get("Cf-Access-Client-Id")).toBe("server-side-client-id");
      expect(headers.get("Cf-Access-Client-Secret")).toBe("server-side-client-secret");
      return new Response("private upstream data", { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const response = await handleFitStatus({ request: new Request("https://fit-ui.example.test/__aura_dev/status"), env });
    expect(await response.json()).toEqual({ state: "ready", detail: "FIT API and database are ready." });
  });

  it("uses Aura login with the selected server-side identity and returns only the normal JWT response", async () => {
    const fetchMock = vi.fn(async (url: URL, init: RequestInit) => {
      expect(url.toString()).toBe("https://fit-api.example.test/api/Auth/login");
      const headers = new Headers(init.headers);
      expect(headers.get("Cf-Access-Client-Id")).toBe("server-side-client-id");
      expect(headers.get("Cf-Access-Client-Secret")).toBe("server-side-client-secret");
      expect(JSON.parse(String(init.body))).toEqual({ email: "a@example.test", password: "private-sample-password-a" });
      return new Response(JSON.stringify({ token: "synthetic-jwt", extra: "private upstream data" }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const request = new Request("https://fit-ui.example.test/__aura_dev/test-login", {
      method: "POST", headers: { Origin: "https://fit-ui.example.test", "Content-Type": "application/json" }, body: JSON.stringify({ clientId: "synthetic-a" }),
    });
    const response = await handleFitTestLogin({ request, env });
    const body = await response.text();
    expect(response.status).toBe(200);
    expect(JSON.parse(body)).toEqual({ token: "synthetic-jwt" });
    expect(body).not.toMatch(/password|example\.test|private upstream/);
  });

  it("rejects cross-origin, arbitrary-client, and non-HTTPS targets", async () => {
    const crossOrigin = await handleFitTestLogin({ request: new Request("https://fit-ui.example.test/__aura_dev/test-login", { method: "POST", headers: { Origin: "https://attacker.example", "Content-Type": "application/json" }, body: JSON.stringify({ clientId: "synthetic-a" }) }), env });
    expect(crossOrigin.status).toBe(403);
    const missing = await handleFitTestLogin({ request: new Request("https://fit-ui.example.test/__aura_dev/test-login", { method: "POST", headers: { Origin: "https://fit-ui.example.test", "Content-Type": "application/json" }, body: JSON.stringify({ clientId: "not-configured" }) }), env });
    expect(missing.status).toBe(404);
    vi.stubGlobal("fetch", vi.fn());
    const badOrigin = await handleFitStatus({ request: new Request("https://fit-ui.example.test/__aura_dev/status"), env: { ...env, API_TUNNEL_URL: "http://fit-api.example.test" } });
    expect(badOrigin.status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });
});
