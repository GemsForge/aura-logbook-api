import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import IconButton from "@mui/joy/IconButton";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import { AuraButton as Button } from "@/components/ui/AuraButton";
import { useEffect, useId, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import {
  spotifyApi, useConnectSpotifyMutation, useDisconnectSpotifyMutation,
  useGetCurrentlyPlayingQuery, useGetSpotifyConnectionQuery, useGetSpotifyPlaylistsQuery,
  useLazyGetSpotifyPlaylistsQuery, type SpotifyPlaylist,
} from "@/store/spotifyApi";

const callbackMessages: Record<string, string> = {
  denied: "Spotify access wasn’t approved. You can connect whenever you’re ready.",
  "state-error": "This sign-in link expired. Please connect again.",
  "reconnect-required": "Spotify sign-in needs to be renewed. Please connect again.",
  "access-denied": "Spotify denied access. Reconnect to review your permissions.",
  "not-configured": "Spotify isn’t available yet. Please try again later.",
  "provider-error": "Spotify couldn’t complete sign-in. Please connect again.",
  "rate-limited": "Spotify is busy. Wait a moment, then try again.",
  unavailable: "Spotify is temporarily unavailable. Please try again.",
};

const popupBlockedMessage = "Your browser blocked the Spotify sign-in window. Allow pop-ups for Aura and try again.";

/** Uses only safe API error messages; never displays raw provider responses or browser errors. */
function errorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { message?: unknown } }).data;
    if (typeof data?.message === "string") return data.message;
  }
  return fallback;
}

/** Renders independently recoverable Spotify connection, playback and playlist sections. */
export default function SpotifyConnectionCard() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector(selectCurrentUser)?.id ?? 0;
  const [searchParams, setSearchParams] = useSearchParams();
  const [notice, setNotice] = useState<string | null>(null);
  const [failedAction, setFailedAction] = useState(false);
  const [connectionGeneration, setConnectionGeneration] = useState(0);
  const [paginationState, setPaginationState] = useState<{
    connectionKey: string;
    items: SpotifyPlaylist[];
    page: { items: SpotifyPlaylist[]; hasMore: boolean; nextOffset: number | null } | null;
  }>({ connectionKey: "", items: [], page: null });
  const carouselRef = useRef<HTMLDivElement>(null);
  const authorizationPopup = useRef<Window | null>(null);
  const carouselId = useId();
  const requestedPageConnectionKey = useRef<string | null>(null);
  const connectionGenerationRef = useRef(0);

  /** Pages the native scroll track without moving focus away from its controls. */
  const scrollPlaylists = (direction: number) => {
    const track = carouselRef.current;
    if (track) track.scrollBy({ left: direction * track.clientWidth });
  };
  const connection = useGetSpotifyConnectionQuery(userId, { skip: !userId, refetchOnMountOrArgChange: true });
  const refetchConnection = connection.refetch;
  const [startConnection, startState] = useConnectSpotifyMutation();
  const [disconnect, disconnectState] = useDisconnectSpotifyMutation();
  const metadataOptions = { skip: !userId || !connection.data?.connected, refetchOnMountOrArgChange: true };
  // Poll only the currently-playing endpoint; playlist data does not need constant refreshes.
  const playback = useGetCurrentlyPlayingQuery(userId, { ...metadataOptions, pollingInterval: 30_000 });
  const playlists = useGetSpotifyPlaylistsQuery({ userId, offset: 0 }, metadataOptions);
  const [fetchMorePlaylists, morePlaylists] = useLazyGetSpotifyPlaylistsQuery();
  const connectionKey = `${userId}:${connection.data?.connected ? "connected" : "disconnected"}:${connectionGeneration}`;

  useEffect(() => {
    setPaginationState({ connectionKey, items: [], page: null });
    requestedPageConnectionKey.current = null;
  }, [connectionKey]);

  useEffect(() => {
    const result = searchParams.get("spotify");
    if (!result) return;
    setFailedAction(result !== "connected");
    setNotice(result === "connected" ? "Spotify connected." : callbackMessages[result] ?? "Spotify couldn’t complete sign-in. Please connect again.");
    if (result === "connected") dispatch(spotifyApi.util.invalidateTags(["SpotifyConnection"]));
    const next = new URLSearchParams(searchParams);
    next.delete("spotify");
    setSearchParams(next, { replace: true });
  }, [dispatch, searchParams, setSearchParams]);

  useEffect(() => {
    /** Accept callback results only from the window opened by this connection card. */
    const handleOAuthMessage = (event: MessageEvent<unknown>) => {
      const popup = authorizationPopup.current;
      if (!popup || event.origin !== window.location.origin || event.source !== popup) return;
      if (!event.data || typeof event.data !== "object" || !("type" in event.data)
        || event.data.type !== "aura.spotify.oauth.complete" || !("result" in event.data)) return;
      const result = event.data.result;
      if (typeof result !== "string" || !Object.prototype.hasOwnProperty.call(callbackMessages, result)
        && result !== "connected") return;

      authorizationPopup.current = null;
      setFailedAction(result !== "connected");
      setNotice(result === "connected" ? "Spotify connected." : callbackMessages[result] ?? "Spotify couldn’t complete sign-in. Please connect again.");
      if (result === "connected") dispatch(spotifyApi.util.invalidateTags(["SpotifyConnection"]));
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, [dispatch]);

  useEffect(() => {
    /** Refresh Spotify status when the user returns from an external authorization window. */
    const refreshConnection = () => {
      if (document.visibilityState === "visible") void refetchConnection();
    };

    window.addEventListener("focus", refreshConnection);
    document.addEventListener("visibilitychange", refreshConnection);
    return () => {
      window.removeEventListener("focus", refreshConnection);
      document.removeEventListener("visibilitychange", refreshConnection);
    };
  }, [refetchConnection]);

  const connect = async () => {
    setNotice(null);
    // Keep the signed-in app loaded while Spotify uses a separate top-level window.
    const popup = window.open("about:blank", "aura-spotify-authorization", "popup");
    if (!popup) {
      setFailedAction(true);
      setNotice(popupBlockedMessage);
      return;
    }
    authorizationPopup.current = popup;
    try {
      const result = await startConnection().unwrap();
      const url = new URL(result.authorizationUrl);
      if (url.origin !== "https://accounts.spotify.com") throw new Error("Invalid sign-in URL");
      popup.location.href = url.href;
    } catch (error) {
      popup.close();
      authorizationPopup.current = null;
      setFailedAction(true);
      setNotice(errorMessage(error, "Couldn’t open Spotify sign-in. Please try again."));
    }
  };

  const handleDisconnect = async () => {
    setNotice(null);
    try {
      await disconnect().unwrap();
      connectionGenerationRef.current += 1;
      setConnectionGeneration(connectionGenerationRef.current);
      requestedPageConnectionKey.current = null;
      // Clear all account metadata when unlinking, including failed or cached queries.
      dispatch(spotifyApi.util.resetApiState());
      setFailedAction(false);
      setNotice("Spotify disconnected.");
    } catch (error) {
      setFailedAction(true);
      setNotice(errorMessage(error, "Couldn’t disconnect Spotify. Please try again."));
    }
  };

  const connected = connection.data?.connected;
  const configured = connection.data?.configured !== false;
  const baseItems = playlists.data?.items ?? [];
  const baseIds = new Set(baseItems.map((playlist) => playlist.id));
  const currentPagination = paginationState.connectionKey === connectionKey ? paginationState : null;
  const items = [...baseItems, ...(currentPagination?.items ?? []).filter((playlist) => !baseIds.has(playlist.id))];
  const nextPlaylistOffset = currentPagination?.page?.nextOffset ?? playlists.data?.nextOffset ?? items.length;
  const hasMorePlaylists = currentPagination?.page?.hasMore ?? playlists.data?.hasMore ?? false;
  const morePageIsCurrent = requestedPageConnectionKey.current === connectionKey;
  const morePlaylistsError = morePageIsCurrent && morePlaylists.isError;
  const track = playback.data;
  const metadataError = playback.isError || playlists.isError || morePlaylistsError;
  const buttonBusy = startState.isLoading || disconnectState.isLoading;

  /** Appends one fetched page only when it still belongs to the active Spotify connection. */
  const loadMorePlaylists = async (offset: number) => {
    const requestedConnection = connectionKey;
    const requestedGeneration = connectionGenerationRef.current;
    requestedPageConnectionKey.current = requestedConnection;
    try {
      const page = await fetchMorePlaylists({ userId, offset }).unwrap();
      if (requestedPageConnectionKey.current !== requestedConnection
        || connectionGenerationRef.current !== requestedGeneration) return;
      setPaginationState((current) => {
        const existingItems = current.connectionKey === requestedConnection ? current.items : [];
        const knownIds = new Set(existingItems.map((playlist) => playlist.id));
        return {
          connectionKey: requestedConnection,
          items: [...existingItems, ...page.items.filter((playlist) => !knownIds.has(playlist.id))],
          page,
        };
      });
    } catch {
      // The lazy query state surfaces a retryable message beside the playlist carousel.
    }
  };

  return (
    <Sheet variant="outlined" className="aura-panel" aria-label="Spotify" sx={{ p: 2.5, minWidth: 0 }}>
      <Stack direction="row" flexWrap="wrap" justifyContent="space-between" alignItems="center" gap={1.5}>
        <Box role="img" aria-label="Spotify" sx={{ color: "#1DB954", display: "inline-flex" }}><svg width="42" height="42" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.59 14.42a.75.75 0 0 1-1.03.25c-2.82-1.72-6.37-2.11-10.55-1.16a.75.75 0 1 1-.33-1.46c4.58-1.05 8.51-.59 11.66 1.34.35.22.46.68.25 1.03Zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.23-1.98-8.15-2.55-11.97-1.4a.94.94 0 1 1-.54-1.8c4.36-1.32 9.78-.68 13.49 1.6.44.27.58.85.31 1.29Zm.13-3.4c-3.87-2.3-10.26-2.52-13.96-1.39a1.12 1.12 0 1 1-.65-2.14c4.25-1.29 11.3-1.04 15.76 1.61a1.12 1.12 0 0 1-1.15 1.92Z" /></svg></Box>
        {connected
          ? <Button variant="outlined" color="neutral" loading={disconnectState.isLoading} disabled={startState.isLoading} onClick={handleDisconnect}>Disconnect</Button>
          : <Button variant="solid" loading={startState.isLoading} disabled={!configured || !userId} onClick={connect}>Connect Spotify</Button>}
      </Stack>
      <Typography level="body-sm" color="neutral" sx={{ mt: 1 }}>Music for your moment.</Typography>
      {notice && <Typography role={failedAction ? "alert" : "status"} level="body-sm" color={failedAction ? "danger" : "neutral"} sx={{ mt: 2 }}>{notice}</Typography>}
      {connection.isFetching && !connection.data && <Typography role="status" level="body-sm" sx={{ mt: 2 }}>Checking Spotify connection…</Typography>}
      {connection.isError && <Box sx={{ mt: 2 }}>
        <Typography role="alert" level="body-sm" color="danger">We couldn’t check your Spotify connection.</Typography>
        <Button variant="plain" loading={connection.isFetching} onClick={() => connection.refetch()}>Retry connection</Button>
      </Box>}
      {!configured && <Typography level="body-sm" sx={{ mt: 2 }}>Spotify isn’t available yet. Please try again later.</Typography>}

      {connected && <Stack spacing={2} sx={{ mt: 2 }}>
        {(track || playback.isFetching || playback.isError) && <Box>
          {playback.isError && <Box>
            <Typography role="alert" level="body-sm" color="danger">{errorMessage(playback.error, "We couldn’t load what’s playing.")}</Typography>
            <Button variant="plain" loading={playback.isFetching} onClick={() => playback.refetch()}>Retry playback</Button>
          </Box>}
          {track ? <Stack direction="row" alignItems="center" gap={1.5} sx={{ mt: 1 }}>
            {track.imageUrl && <Box component="img" src={track.imageUrl} alt="" sx={{ width: 48, height: 48, borderRadius: "sm", objectFit: "cover" }} />}
            <Box sx={{ minWidth: 0 }}>
              <Typography level="body-xs" color="neutral">{track.isPlaying ? "Now playing" : "Paused"}</Typography>
              <Typography level="title-sm">{track.name}</Typography>
              <Typography level="body-sm" color="neutral">{track.artists}</Typography>
              {track.spotifyUrl && <Typography component="a" href={track.spotifyUrl} target="_blank" rel="noopener noreferrer" level="body-sm">Open in Spotify</Typography>}
            </Box>
          </Stack> : playback.isFetching ? <Typography role="status" level="body-sm">Loading what’s playing…</Typography>
            : null}
        </Box>}
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography level="body-sm" component="h3" sx={{ fontWeight: 600 }}>Your playlists</Typography>
            {items.length > 3 && <Stack direction="row" spacing={0.5}>
              <IconButton size="sm" variant="plain" aria-label="Previous playlists" aria-controls={carouselId} onClick={() => scrollPlaylists(-1)}><ChevronLeft /></IconButton>
              <IconButton size="sm" variant="plain" aria-label="Next playlists" aria-controls={carouselId} onClick={() => scrollPlaylists(1)}><ChevronRight /></IconButton>
            </Stack>}
          </Stack>
          {playlists.isError && <Box>
            <Typography role="alert" level="body-sm" color="danger">{errorMessage(playlists.error, "We couldn’t refresh your playlists.")}</Typography>
            <Button variant="plain" loading={playlists.isFetching} onClick={() => playlists.refetch()}>Retry playlists</Button>
          </Box>}
          {playlists.isFetching && !items.length && <Typography role="status" level="body-sm">Loading your playlists…</Typography>}
          {!playlists.isFetching && !playlists.isError && !items.length && <Typography level="body-sm" color="neutral">No playlists to show yet.</Typography>}
          {morePlaylistsError && <Box>
            <Typography role="alert" level="body-sm" color="danger">{errorMessage(morePlaylists.error, "We couldn’t load more playlists.")}</Typography>
            <Button variant="plain" loading={morePlaylists.isFetching} onClick={() => void loadMorePlaylists(nextPlaylistOffset)}>Retry loading playlists</Button>
          </Box>}
          {/* Native scrolling supports touch, trackpads, and focus navigation without autoplay. */}
          <Box ref={carouselRef} id={carouselId} role="region" aria-label="Spotify playlists" aria-roledescription="carousel"
            sx={{ display: "flex", gap: 1, overflowX: "auto", scrollSnapType: "x mandatory", scrollBehavior: "smooth", p: 0.5,
              "@media (prefers-reduced-motion: reduce)": { scrollBehavior: "auto" } }}>
            {items.map((playlist) => <Sheet
              key={playlist.id}
              component={playlist.spotifyUrl ? "a" : "div"}
              href={playlist.spotifyUrl || undefined}
              aria-label={playlist.spotifyUrl ? `Open ${playlist.name} in Spotify` : undefined}
              target={playlist.spotifyUrl ? "_blank" : undefined}
              rel={playlist.spotifyUrl ? "noopener noreferrer" : undefined}
              variant="soft"
              sx={{
                p: 0.5, borderRadius: "md", minWidth: 0, flex: "0 0 calc((100% - 16px) / 3)", boxSizing: "border-box", scrollSnapAlign: "start", textDecoration: "none", color: "inherit",
                border: "1px solid var(--aura-line)",
                boxShadow: "0 0 7px var(--aura-wash)",
                transition: "background-color 0.2s, box-shadow 0.2s",
                ...(playlist.spotifyUrl && {
                  "&:hover": { backgroundColor: "var(--aura-wash)", boxShadow: "0 0 12px var(--aura-glow)" },
                  "&:focus-visible": { outline: "2px solid var(--aura-accent)", outlineOffset: 2, boxShadow: "0 0 12px var(--aura-glow)" },
                }),
              }}
            >
              {playlist.imageUrl ? <Box component="img" src={playlist.imageUrl} alt="" loading="lazy" sx={{ display: "block", width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "sm" }} />
                : <Box aria-hidden="true" sx={{ aspectRatio: "1", backgroundColor: "neutral.softBg", borderRadius: "sm" }} />}
              {/* Compact captions preserve cover emphasis; the full title remains the link's accessible name. */}
              <Typography level="body-xs" title={playlist.name} sx={{ mt: 0.5, fontSize: "0.6875rem", lineHeight: 1.3, fontWeight: 500, overflowWrap: "anywhere", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" }}>{playlist.name}</Typography>
            </Sheet>)}
          </Box>
          {hasMorePlaylists && <Button
            variant="plain"
            loading={morePlaylists.isFetching}
            disabled={morePlaylists.isFetching}
            onClick={() => void loadMorePlaylists(nextPlaylistOffset)}
          >Load more playlists</Button>}
          {items.length > 3 && <Typography level="body-xs" color="neutral" sx={{ mt: 1 }}>Browse {items.length} playlists · swipe or use the arrows</Typography>}
        </Box>
        {(metadataError || failedAction) && <Button variant="soft" loading={startState.isLoading} disabled={buttonBusy} onClick={connect}>Reconnect Spotify</Button>}
      </Stack>}
    </Sheet>
  );
}
