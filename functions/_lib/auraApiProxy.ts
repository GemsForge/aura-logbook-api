export interface PagesEnvironment {
  API_TUNNEL_URL?: string;
  ACCESS_SERVICE_TOKEN_CLIENT_ID?: string;
  ACCESS_SERVICE_TOKEN_CLIENT_SECRET?: string;
}

const accessHeaderNames = [
  "cf-access-client-id",
  "cf-access-client-secret",
];

const hopByHopHeaderNames = [
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
];

/**
 * Proxies a same-origin Pages route to the configured Access-protected Aura API.
 * The Access identity is added only on the server; Aura's bearer token continues
 * to carry the signed-in user's identity to the API.
 *
 * @param request The incoming Pages request.
 * @param env Server-side API origin and Cloudflare Access service-token bindings.
 * @param pagesPathPrefix Prefix used to keep same-origin redirects on a Pages Function route.
 * @returns The upstream response or a generic, non-sensitive proxy error.
 */
export async function forwardAuraApiRequest(
  request: Request,
  env: PagesEnvironment,
  pagesPathPrefix: string,
): Promise<Response> {
  const apiOrigin = resolveApiOrigin(env.API_TUNNEL_URL);
  const clientId = env.ACCESS_SERVICE_TOKEN_CLIENT_ID?.trim();
  const clientSecret = env.ACCESS_SERVICE_TOKEN_CLIENT_SECRET?.trim();

  if (!apiOrigin || !clientId || !clientSecret) {
    return safeError(503, "FIT API proxy is not configured.");
  }

  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(`${incomingUrl.pathname}${incomingUrl.search}`, apiOrigin);
  const headers = new Headers(request.headers);
  const connectionHeader = headers.get("connection");

  for (const name of [...accessHeaderNames, ...hopByHopHeaderNames]) {
    headers.delete(name);
  }
  for (const name of connectionHeader?.split(",") ?? []) {
    const connectionOption = name.trim();
    if (/^[a-z0-9-]+$/i.test(connectionOption)) headers.delete(connectionOption);
  }
  headers.delete("host");
  headers.delete("content-length");
  headers.set("CF-Access-Client-Id", clientId);
  headers.set("CF-Access-Client-Secret", clientSecret);

  try {
    const requestBody = request.method === "GET" || request.method === "HEAD" ? undefined : request.body;
    const requestInit: RequestInit & { duplex?: "half" } = {
      method: request.method,
      headers,
      body: requestBody,
      redirect: "manual",
      ...(requestBody ? { duplex: "half" as const } : {}),
    };
    const upstreamRequest = new Request(upstreamUrl, requestInit);
    const upstreamResponse = await fetch(upstreamRequest);
    const responseHeaders = new Headers(upstreamResponse.headers);
    for (const name of [...hopByHopHeaderNames, "content-length"] as const) {
      responseHeaders.delete(name);
    }
    responseHeaders.set("cache-control", "no-store");
    const location = responseHeaders.get("location");

    if (location) {
      responseHeaders.set("location", rewriteApiRedirect(location, apiOrigin, incomingUrl.origin, pagesPathPrefix));
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch {
    // Do not include the upstream URL, headers, or exception in a response or log.
    return safeError(502, "FIT API is temporarily unavailable.");
  }
}

/** Accepts only a configured HTTPS origin so request paths cannot select the proxy target. */
function resolveApiOrigin(value: string | undefined): string | null {
  if (!value?.trim()) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

/** Rewrites same-API redirects to Pages so browser navigation stays behind UI Access. */
function rewriteApiRedirect(location: string, apiOrigin: string, pagesOrigin: string, pagesPathPrefix: string): string {
  try {
    const target = new URL(location, apiOrigin);
    if (target.origin !== apiOrigin) return location;
    const path = target.pathname.startsWith(pagesPathPrefix)
      ? target.pathname
      : `${pagesPathPrefix}${target.pathname}`;
    return `${pagesOrigin}${path}${target.search}${target.hash}`;
  } catch {
    return location;
  }
}

/** Returns generic JSON without configuration or upstream diagnostics. */
function safeError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
