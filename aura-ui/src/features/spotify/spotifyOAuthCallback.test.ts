import { describe, expect, it, vi } from "vitest";
import { notifySpotifyOAuthOpener, readSpotifyOAuthResult } from "./spotifyOAuthCallback";

describe("Spotify OAuth return handling", () => {
  it("accepts known result codes and ignores untrusted values", () => {
    expect(readSpotifyOAuthResult("?spotify=connected")).toBe("connected");
    expect(readSpotifyOAuthResult("?spotify=state-error")).toBe("state-error");
    expect(readSpotifyOAuthResult("?spotify=https%3A%2F%2Fevil.example")).toBeNull();
    expect(readSpotifyOAuthResult("?other=value")).toBeNull();
  });

  it("sends the result to the Aura window at the supplied origin", () => {
    const postMessage = vi.fn();
    expect(notifySpotifyOAuthOpener({ postMessage }, "https://aura.example", "connected")).toBe(true);
    expect(postMessage).toHaveBeenCalledWith(
      { type: "aura.spotify.oauth.complete", result: "connected" },
      "https://aura.example",
    );
  });

  it("does not send a result when the callback has no opener", () => {
    expect(notifySpotifyOAuthOpener(null, "https://aura.example", "denied")).toBe(false);
  });
});
