/** The result codes the API may append after completing Spotify authorization. */
export const spotifyOAuthResults = [
  "connected",
  "denied",
  "state-error",
  "reconnect-required",
  "access-denied",
  "not-configured",
  "provider-error",
  "rate-limited",
  "unavailable",
] as const;

export type SpotifyOAuthResult = (typeof spotifyOAuthResults)[number];

/** Reads only recognized Spotify callback outcomes from the frontend URL. */
export function readSpotifyOAuthResult(search: string): SpotifyOAuthResult | null {
  const result = new URLSearchParams(search).get("spotify");
  return spotifyOAuthResults.find((knownResult) => knownResult === result) ?? null;
}

/** Notifies an Aura window using its exact origin so OAuth results never cross origins. */
export function notifySpotifyOAuthOpener(
  opener: Pick<Window, "postMessage"> | null,
  targetOrigin: string,
  result: SpotifyOAuthResult,
): boolean {
  if (!opener) return false;
  opener.postMessage({ type: "aura.spotify.oauth.complete", result }, targetOrigin);
  return true;
}
