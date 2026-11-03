import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import { useLazyGetSpotifyConnectUrlQuery, useDisconnectSpotifyMutation, useGetCurrentlyPlayingQuery, useGetSpotifyConnectionQuery, useGetSpotifyPlaylistsQuery } from "@/store/spotifyApi";

/** Displays the authenticated user's Spotify connection and metadata-only listening state. */
export default function SpotifyConnectionCard() {
  const { data: connection, isLoading: connectionLoading } = useGetSpotifyConnectionQuery();
  const [getConnectUrl, { isFetching: connecting }] = useLazyGetSpotifyConnectUrlQuery();
  const [disconnect, { isLoading: disconnecting }] = useDisconnectSpotifyMutation();
  const { data: current } = useGetCurrentlyPlayingQuery(undefined, { skip: !connection?.connected });
  const { data: playlists } = useGetSpotifyPlaylistsQuery(undefined, { skip: !connection?.connected });

  const connect = async () => {
    const result = await getConnectUrl().unwrap();
    window.location.assign(result.authorizationUrl);
  };
  const item = current?.item as Record<string, unknown> | undefined;
  const artists = Array.isArray(item?.artists) ? item.artists.map((artist) => (artist as Record<string, unknown>).name).filter(Boolean).join(", ") : "";
  const playlistItems = playlists?.items ?? [];

  return (
    <Sheet variant="outlined" sx={{ p: 2.5, borderRadius: "lg", backgroundColor: "background.surface" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
        <Box><Typography level="h3">Spotify</Typography><Typography level="body-sm" color="neutral">Bring your listening ritual into your logbook.</Typography></Box>
        {connection?.connected ? <Button variant="outlined" color="neutral" loading={disconnecting} onClick={() => disconnect()}>Disconnect</Button> : <Button variant="solid" loading={connectionLoading || connecting} onClick={connect}>Connect Spotify</Button>}
      </Stack>
      {connection?.connected && <Box sx={{ mt: 2 }}>
        {item ? <><Typography level="title-md">{String(item.name ?? "Now playing")}</Typography><Typography level="body-sm" color="neutral">{artists}</Typography></> : <Typography level="body-sm" color="neutral">Nothing is playing right now.</Typography>}
        {playlistItems.length > 0 && <Typography level="body-sm" sx={{ mt: 1.5 }}>{playlistItems.length} playlist{playlistItems.length === 1 ? "" : "s"} available in Spotify.</Typography>}
      </Box>}
    </Sheet>
  );
}
