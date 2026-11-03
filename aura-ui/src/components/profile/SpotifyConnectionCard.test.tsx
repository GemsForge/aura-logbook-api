import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAuthenticatedState, renderWithProviders } from "@/test/testUtilities";
import type { SpotifyPlaylist } from "@/store/spotifyApi";
import SpotifyConnectionCard from "./SpotifyConnectionCard";

const state = vi.hoisted(() => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  connection: { data: { configured: true, connected: true }, isFetching: false, isError: false, refetch: vi.fn() },
  current: { data: null, isFetching: true, isError: false, refetch: vi.fn() },
  playlists: { data: { items: [] as SpotifyPlaylist[] }, isFetching: true, isError: false, refetch: vi.fn() },
}));

vi.mock("@/store/spotifyApi", () => ({
  spotifyApi: { util: { invalidateTags: () => ({ type: "spotify/invalidate" }), resetApiState: () => ({ type: "spotify/reset" }) } },
  useGetSpotifyConnectionQuery: () => state.connection,
  useGetCurrentlyPlayingQuery: () => state.current,
  useGetSpotifyPlaylistsQuery: () => state.playlists,
  useConnectSpotifyMutation: () => [state.connect, { isLoading: false }],
  useDisconnectSpotifyMutation: () => [state.disconnect, { isLoading: false }],
}));

/** Exercises recovery and loading states without requiring a Spotify account. */
describe("SpotifyConnectionCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.connection.data.connected = true;
    state.connection.isError = false;
    state.current.isFetching = true;
    state.current.isError = false;
    state.playlists.isFetching = true;
    state.playlists.isError = false;
    state.playlists.data.items = [];
  });

  it("distinguishes pending requests from empty playback and playlists", () => {
    renderWithProviders(<SpotifyConnectionCard />, { preloadedState: createAuthenticatedState() });
    expect(screen.getByText("Loading what’s playing…")).toBeInTheDocument();
    expect(screen.getByText("Loading your playlists…")).toBeInTheDocument();
    expect(screen.queryByText("Nothing is playing right now.")).not.toBeInTheDocument();
    expect(screen.queryByText("No playlists to show yet.")).not.toBeInTheDocument();
  });

  it("retains cached playlist cards during a failed refresh and retries on request", async () => {
    state.playlists.isFetching = false;
    state.playlists.isError = true;
    state.playlists.data.items = [{ id: "one", name: "Quiet evening", imageUrl: null, spotifyUrl: "https://open.spotify.com/playlist/one" }];
    renderWithProviders(<SpotifyConnectionCard />, { preloadedState: createAuthenticatedState() });
    expect(screen.getByRole("link", { name: "Open Quiet evening in Spotify" })).toHaveAttribute("href", "https://open.spotify.com/playlist/one");
    await userEvent.click(screen.getByRole("button", { name: "Retry playlists" }));
    expect(state.playlists.refetch).toHaveBeenCalledOnce();
  });

  it("offers recovery after a connection status failure", async () => {
    state.connection.data.connected = false;
    state.connection.isError = true;
    renderWithProviders(<SpotifyConnectionCard />, { preloadedState: createAuthenticatedState() });
    expect(screen.getByRole("button", { name: "Connect Spotify" })).toBeEnabled();
    await userEvent.click(screen.getByRole("button", { name: "Retry connection" }));
    expect(state.connection.refetch).toHaveBeenCalledOnce();
  });

  it("shows a failed sign-in request without an unhandled rejection", async () => {
    state.connection.data.connected = false;
    state.connect.mockReturnValue({ unwrap: () => Promise.reject({ status: 503, data: { message: "Spotify is not available yet." } }) });
    renderWithProviders(<SpotifyConnectionCard />, { preloadedState: createAuthenticatedState() });
    await userEvent.click(screen.getByRole("button", { name: "Connect Spotify" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Spotify is not available yet.");
  });

  it("explains an expired callback and offers a fresh authorization", async () => {
    renderWithProviders(<SpotifyConnectionCard />, { preloadedState: createAuthenticatedState(), route: "/dashboard?spotify=state-error" });
    expect(await screen.findByRole("alert")).toHaveTextContent("This sign-in link expired. Please connect again.");
    expect(screen.getByRole("button", { name: "Reconnect Spotify" })).toBeEnabled();
  });
});
