const publicAuthEndpoint = /\/auth\/(?:login|register)\/?$/i;

export function shouldClearAuthenticationState(
  status: number | undefined,
  requestUrl: string | undefined,
): boolean {
  if (status !== 401 && status !== 403) return false;

  const path = requestUrl?.split("?")[0] ?? "";
  return !publicAuthEndpoint.test(path);
}
