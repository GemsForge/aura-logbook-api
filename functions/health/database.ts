import { forwardAuraApiRequest, type PagesEnvironment } from "../_lib/auraApiProxy";

interface PagesRequestContext {
  request: Request;
  env: PagesEnvironment;
}

/** Keeps the database readiness probe behind the same Pages and Access boundary as the UI. */
export function onRequest({ request, env }: PagesRequestContext): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return Promise.resolve(new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } }));
  }
  return forwardAuraApiRequest(request, env, "");
}
