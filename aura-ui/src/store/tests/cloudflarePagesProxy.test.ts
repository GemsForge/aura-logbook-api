import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest as onApiRequest } from "../../../../functions/api/[[path]]";
import { onRequest as onDatabaseHealthRequest } from "../../../../functions/health/database";

const configuredEnvironment = {
  API_TUNNEL_URL: "https://api.fit.example",
  ACCESS_SERVICE_TOKEN_CLIENT_ID: "fit-client-id",
  ACCESS_SERVICE_TOKEN_CLIENT_SECRET: "fit-client-secret",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Cloudflare Pages FIT API proxy", () => {
  it("forwards the request and replaces caller supplied Access credentials", async () => {
    let forwardedRequest: Request | undefined;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      forwardedRequest = input instanceof Request ? input : new Request(input);
      return new Response("{\"ok\":true}", { status: 200 });
    });

    const request = new Request("https://aura.fit.example/api/Mood?range=week", {
      method: "POST",
      headers: {
        Authorization: "Bearer aura-user-token",
        "Content-Type": "application/json",
        "CF-Access-Client-Id": "attacker-client-id",
        "CF-Access-Client-Secret": "attacker-client-secret",
        Connection: "x-internal-header",
        "X-Internal-Header": "hop-by-hop-value",
      },
      body: "{\"mood\":\"calm\"}",
    });

    const response = await onApiRequest({ request, env: configuredEnvironment });

    expect(response.status).toBe(200);
    expect(forwardedRequest?.url).toBe("https://api.fit.example/api/Mood?range=week");
    expect(forwardedRequest?.method).toBe("POST");
    expect(forwardedRequest?.headers.get("Authorization")).toBe("Bearer aura-user-token");
    expect(forwardedRequest?.headers.get("CF-Access-Client-Id")).toBe("fit-client-id");
    expect(forwardedRequest?.headers.get("CF-Access-Client-Secret")).toBe("fit-client-secret");
    expect(forwardedRequest?.headers.has("Connection")).toBe(false);
    expect(forwardedRequest?.headers.has("X-Internal-Header")).toBe(false);
    expect(await forwardedRequest?.text()).toBe("{\"mood\":\"calm\"}");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("fails closed when the upstream or service credentials are missing or invalid", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const request = new Request("https://aura.fit.example/api/Auth/login", { method: "POST" });

    const missingSecret = await onApiRequest({
      request,
      env: { ...configuredEnvironment, ACCESS_SERVICE_TOKEN_CLIENT_SECRET: " " },
    });
    const invalidOrigin = await onApiRequest({
      request,
      env: { ...configuredEnvironment, API_TUNNEL_URL: "http://api.fit.example" },
    });

    expect(missingSecret.status).toBe(503);
    expect(invalidOrigin.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rewrites redirects to the API origin back through the same Pages route", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, {
      status: 302,
      headers: { Location: "https://api.fit.example/api/Auth/provider/callback?code=test" },
    }));

    const response = await onApiRequest({
      request: new Request("https://aura.fit.example/api/Auth/provider/start"),
      env: configuredEnvironment,
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(
      "https://aura.fit.example/api/Auth/provider/callback?code=test",
    );
  });

  it("preserves external provider redirects", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, {
      status: 302,
      headers: { Location: "https://accounts.spotify.com/authorize?client_id=public" },
    }));

    const response = await onApiRequest({
      request: new Request("https://aura.fit.example/api/spotify/connect"),
      env: configuredEnvironment,
    });

    expect(response.headers.get("Location")).toBe(
      "https://accounts.spotify.com/authorize?client_id=public",
    );
  });

  it("returns a generic gateway error without exposing fetch failures", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("secret upstream failure"));

    const response = await onApiRequest({
      request: new Request("https://aura.fit.example/api/Mood"),
      env: configuredEnvironment,
    });

    expect(response.status).toBe(502);
    expect(await response.text()).toBe("{\"error\":\"FIT API is temporarily unavailable.\"}");
  });

  it("proxies only GET and HEAD database health requests to the exact API health route", async () => {
    let forwardedRequest: Request | undefined;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      forwardedRequest = input instanceof Request ? input : new Request(input);
      return new Response("{\"status\":\"healthy\"}", { status: 200 });
    });
    const env = configuredEnvironment;

    const getResponse = await onDatabaseHealthRequest({
      request: new Request("https://aura.fit.example/health/database"),
      env,
    });
    const postResponse = await onDatabaseHealthRequest({
      request: new Request("https://aura.fit.example/health/database", { method: "POST" }),
      env,
    });

    expect(getResponse.status).toBe(200);
    expect(forwardedRequest?.url).toBe("https://api.fit.example/health/database");
    expect(forwardedRequest?.headers.get("CF-Access-Client-Id")).toBe("fit-client-id");
    expect(postResponse.status).toBe(405);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
