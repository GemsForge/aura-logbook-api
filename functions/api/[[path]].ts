import { forwardAuraApiRequest, type PagesEnvironment } from "../_lib/auraApiProxy";

interface PagesRequestContext {
  request: Request;
  env: PagesEnvironment;
}

/** Forwards Aura's API route through the Pages-held Cloudflare Access identity. */
export function onRequest({ request, env }: PagesRequestContext): Promise<Response> {
  return forwardAuraApiRequest(request, env, "/api");
}
