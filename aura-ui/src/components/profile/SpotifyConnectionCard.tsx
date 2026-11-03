import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import { AuraButton as Button } from "@/components/ui/AuraButton";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import {
  spotifyApi, useConnectSpotifyMutation, useDisconnectSpotifyMutation,
  useGetCurrentlyPlayingQuery, useGetSpotifyConnectionQuery, useGetSpotifyPlaylistsQuery,
} from "@/store/spotifyApi";

const callbackMessages: Record<string, string> = {
  denied: "Spotify access wasn’t approved. You can connect whenever you’re ready.",
  "state-error": "This sign-in link expired. Please connect again.",
  "reconnect-required": "Spotify sign-in needs to be renewed. Please connect again.",
  "access-denied": "Spotify denied access. Reconnect to review your permissions.",
  "not-configured": "Spotify isn’t available yet. Please try again later.",
};

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
  const connection = useGetSpotifyConnectionQuery(userId, { skip: !userId, refetchOnMountOrArgChange: true });
  const [startConnection, startState] = useConnectSpotifyMutation();
  const [disconnect, disconnectState] = useDisconnectSpotifyMutation();
  const metadataOptions = { skip: !userId || !connection.data?.connected, refetchOnMountOrArgChange: true };
  const playback = useGetCurrentlyPlayingQuery(userId, metadataOptions);
  const playlists = useGetSpotifyPlaylistsQuery(userId, metadataOptions);

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

  const connect = async () => {
    setNotice(null);
    try {
      const result = await startConnection().unwrap();
      const url = new URL(result.authorizationUrl);
      if (url.origin !== "https://accounts.spotify.com") throw new Error("Invalid sign-in URL");
      window.location.assign(url.href);
    } catch (error) {
      setFailedAction(true);
      setNotice(errorMessage(error, "Couldn’t open Spotify sign-in. Please try again."));
    }
  };

  const handleDisconnect = async () => {
    setNotice(null);
    try {
      await disconnect().unwrap();
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
  const items = playlists.data?.items ?? [];
  const track = playback.data;
  const metadataError = playback.isError || playlists.isError;
  const buttonBusy = startState.isLoading || disconnectState.isLoading;

  return (
    <Sheet variant="outlined" aria-label="Spotify" sx={{ p: 2.5, borderRadius: "lg", backgroundColor: "background.surface" }}>
      <Stack direction="row" flexWrap="wrap" justifyContent="space-between" alignItems="center" gap={1.5}>
        <Box role="img" aria-label="Spotify" sx={{ color: "#1DB954", display: "inline-flex" }}><svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.59 14.42a.75.75 0 0 1-1.03.25c-2.82-1.72-6.37-2.11-10.55-1.16a.75.75 0 1 1-.33-1.46c4.58-1.05 8.51-.59 11.66 1.34.35.22.46.68.25 1.03Zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.23-1.98-8.15-2.55-11.97-1.4a.94.94 0 1 1-.54-1.8c4.36-1.32 9.78-.68 13.49 1.6.44.27.58.85.31 1.29Zm.13-3.4c-3.87-2.3-10.26-2.52-13.96-1.39a1.12 1.12 0 1 1-.65-2.14c4.25-1.29 11.3-1.04 15.76 1.61a1.12 1.12 0 0 1-1.15 1.92Z" /></svg></Box>
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
        <Box>
          <Typography level="title-sm" component="h3">Your listening</Typography>
          {!playback.isError && <Button variant="plain" size="sm" loading={playback.isFetching} onClick={() => playback.refetch()}>Refresh listening</Button>}
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
            : !playback.isError && <Typography level="body-sm" color="neutral">Nothing is playing right now.</Typography>}
        </Box>
        <Box>
          <Typography level="title-sm" component="h3" sx={{ mb: 1 }}>Your playlists</Typography>
          {playlists.isError && <Box>
            <Typography role="alert" level="body-sm" color="danger">{errorMessage(playlists.error, "We couldn’t refresh your playlists.")}</Typography>
            <Button variant="plain" loading={playlists.isFetching} onClick={() => playlists.refetch()}>Retry playlists</Button>
          </Box>}
          {playlists.isFetching && !items.length && <Typography role="status" level="body-sm">Loading your playlists…</Typography>}
          {!playlists.isFetching && !playlists.isError && !items.length && <Typography level="body-sm" color="neutral">No playlists to show yet.</Typography>}
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 120px), 1fr))", gap: 1.5 }}>
            {items.slice(0, 6).map((playlist) => <Sheet key={playlist.id} variant="soft" sx={{ p: 1, borderRadius: "md", minWidth: 0 }}>
              {playlist.imageUrl ? <Box component="img" src={playlist.imageUrl} alt="" loading="lazy" sx={{ display: "block", width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "sm" }} />
                : <Box aria-hidden="true" sx={{ aspectRatio: "1", backgroundColor: "neutral.softBg", borderRadius: "sm" }} />}
              <Typography level="body-sm" sx={{ mt: 1, fontWeight: 600, overflowWrap: "anywhere" }}>{playlist.name}</Typography>
              {playlist.spotifyUrl && <Typography component="a" href={playlist.spotifyUrl} target="_blank" rel="noopener noreferrer" level="body-xs">Open {playlist.name} in Spotify</Typography>}
            </Sheet>)}
          </Box>
          {items.length > 6 && <Typography level="body-xs" color="neutral" sx={{ mt: 1 }}>Showing 6 of {items.length} loaded playlists.</Typography>}
        </Box>
        {(metadataError || failedAction) && <Button variant="soft" loading={startState.isLoading} disabled={buttonBusy} onClick={connect}>Reconnect Spotify</Button>}
      </Stack>}
    </Sheet>
  );
}
