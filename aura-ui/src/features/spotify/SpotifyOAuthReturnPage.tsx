import type { SpotifyOAuthResult } from "./spotifyOAuthCallback";

/** Gives an OAuth callback a safe recovery view when its browser context has no Aura session. */
export default function SpotifyOAuthReturnPage({ result }: { result: SpotifyOAuthResult }) {
  const message = result === "connected"
    ? "Spotify is connected. Return to the Aura Logbook app to continue."
    : "Spotify sign-in did not complete. Return to the Aura Logbook app to try again.";

  return (
    <main style={{ maxWidth: 480, margin: "12vh auto", padding: 24, fontFamily: "system-ui, sans-serif", lineHeight: 1.5 }}>
      <h1>Aura Logbook</h1>
      <p role="status">{message}</p>
      <button type="button" onClick={() => window.close()}>Close this window</button>
    </main>
  );
}
