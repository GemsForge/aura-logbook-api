import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import Box from "@mui/joy/Box";
import IconButton from "@mui/joy/IconButton";
import Typography from "@mui/joy/Typography";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import MusicNoteOutlined from "@mui/icons-material/MusicNoteOutlined";
import CloudOutlined from "@mui/icons-material/CloudOutlined";
import WbSunnyOutlined from "@mui/icons-material/WbSunnyOutlined";
import { AuraModal } from "@/components/ui/AuraModal";
import PhotoNavigationControls from "@/components/history/PhotoNavigationControls";
import { usePhotoViewerNavigation } from "@/components/history/photoViewerNavigation";
import { MoodMediaApi, type MoodMediaAttachment } from "@/api/MoodMediaApi";
import type { MoodEntry } from "@/features/mood/models/schema";

/** Parses a JSON snapshot column, returning null for missing or malformed data. */
export function parseSnapshot<T>(value?: string | null): T | null {
  if (!value) return null;
  try { return JSON.parse(value) as T; } catch { return null; }
}

const itemSx = {
  flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: .6, height: 28, px: 1.25,
  borderRadius: 999, border: "1px solid var(--al-theme-border)", bgcolor: "var(--al-theme-surface-raised)",
  color: "var(--al-theme-ink)", fontSize: "var(--joy-fontSize-xs)", whiteSpace: "nowrap", font: "inherit", cursor: "pointer",
  "&:focus-visible": { outline: "2px solid var(--al-theme-focus)", outlineOffset: 2 },
} as const;

/**
 * One-line strip of what was captured with a check-in: the song playing, the weather, and private photos.
 * Keyboard model (roving tabindex): the strip is a single Tab stop; Left/Right move between items, Home/End
 * jump to the ends, Enter/Space activate, and the focused item always scrolls fully into view. Scroll buttons
 * appear only when more items are hidden in that direction. Renders nothing when nothing was captured.
 */
export default function MomentStrip({ entry }: { entry: MoodEntry }) {
  const song = parseSnapshot<{ name?: string; artists?: string }>(entry.musicTrack);
  const weather = parseSnapshot<{ description?: string; iconCode?: string; temperature?: number; unit?: string }>(entry.weatherSnapshot);
  const [photos, setPhotos] = useState<MoodMediaAttachment[]>([]);
  const [active, setActive] = useState(0);
  const [viewing, setViewing] = useState<MoodMediaAttachment | null>(null);
  const [overflow, setOverflow] = useState({ left: false, right: false });
  const stripRef = useRef<HTMLDivElement>(null);
  const time = entry.createdAt ? new Date(entry.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";

  // Photos are private and fetched per entry, only when the entry reports having any.
  useEffect(() => {
    if (!entry.photoCount) { setPhotos([]); return; }
    let live = true;
    MoodMediaApi.getForMood(entry.id).then((items) => { if (live) setPhotos(items); }).catch(() => { if (live) setPhotos([]); });
    return () => { live = false; };
  }, [entry.id, entry.photoCount]);

  const updateOverflow = () => {
    const strip = stripRef.current;
    if (!strip) return;
    setOverflow({ left: strip.scrollLeft > 2, right: strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 2 });
  };
  useEffect(updateOverflow, [photos.length]);

  const items: ReactNode[] = [];
  const labels: string[] = [];
  if (song?.name) {
    const label = `Song: ${song.name}${song.artists ? ` by ${song.artists}` : ""}, opens in Spotify`;
    labels.push(label);
    items.push(
      <Box component="a" key="song" href={`https://open.spotify.com/search/${encodeURIComponent(`${song.name} ${song.artists ?? ""}`.trim())}`} target="_blank" rel="noreferrer" tabIndex={-1} aria-label={label} sx={{ ...itemSx, textDecoration: "none" }}>
        <MusicNoteOutlined aria-hidden="true" sx={{ fontSize: 16, color: "#b39ddb" }} />{song.name}{song.artists ? ` · ${song.artists}` : ""}
      </Box>,
    );
  }
  if (weather?.description) {
    const temperature = weather.temperature !== undefined ? `${Math.round(weather.temperature)}°${weather.unit ?? "F"} ` : "";
    const clear = /clear/i.test(weather.description) || (weather.iconCode ?? "").startsWith("01");
    labels.push(`Weather: ${temperature}${weather.description}`);
    // Weather has no action; it is focusable so keyboard and screen-reader users reach it in order.
    items.push(
      <Box component="span" key="weather" role="img" aria-label={`Weather: ${temperature}${weather.description}`} sx={{ ...itemSx, cursor: "default" }}>
        {clear ? <WbSunnyOutlined aria-hidden="true" sx={{ fontSize: 16, color: "#f2c94c" }} /> : <CloudOutlined aria-hidden="true" sx={{ fontSize: 16, color: "#9fb7e6" }} />}
        {temperature}{weather.description}
      </Box>,
    );
  }
  photos.forEach((photo, index) => {
    const label = `Photo ${index + 1} of ${photos.length}, opens viewer`;
    labels.push(label);
    items.push(<PhotoThumb key={photo.id} entryId={entry.id} photo={photo} label={label} onOpen={() => setViewing(photo)} />);
  });
  if (!items.length) return null;

  const focusItem = (index: number) => {
    setActive(index);
    const element = stripRef.current?.children[index] as HTMLElement | undefined;
    element?.focus();
    element?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = items.length - 1;
    const next = event.key === "ArrowRight" ? Math.min(active + 1, last)
      : event.key === "ArrowLeft" ? Math.max(active - 1, 0)
        : event.key === "Home" ? 0 : event.key === "End" ? last : null;
    if (next === null) return;
    event.preventDefault();
    focusItem(next);
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: .5, mt: 1 }}>
      {overflow.left && <IconButton size="sm" variant="outlined" aria-label="Scroll moments left" onClick={() => stripRef.current?.scrollBy({ left: -200, behavior: "smooth" })} sx={{ borderRadius: "50%", minWidth: 28, minHeight: 28 }}><ChevronLeft fontSize="small" /></IconButton>}
      <Box ref={stripRef} role="list" aria-label={`Moments from this ${time} check-in`} onKeyDown={onKeyDown} onScroll={updateOverflow}
        sx={{ display: "flex", alignItems: "center", gap: .75, overflowX: "auto", p: "3px", flex: 1, minWidth: 0, scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
        {items.map((item, index) => (
          <Box key={index} role="listitem" tabIndex={index === active ? 0 : -1} aria-label={labels[index]} onFocus={() => setActive(index)}
            onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && event.target === event.currentTarget) { event.preventDefault(); (event.currentTarget.firstElementChild as HTMLElement | null)?.click(); } }}
            sx={{ flex: "0 0 auto", borderRadius: 999, "&:focus-visible": { outline: "2px solid var(--al-theme-focus)", outlineOffset: 2 }, "& > *": { pointerEvents: "auto" } }}>
            {item}
          </Box>
        ))}
      </Box>
      {overflow.right && <IconButton size="sm" variant="outlined" aria-label="Scroll moments right" onClick={() => stripRef.current?.scrollBy({ left: 200, behavior: "smooth" })} sx={{ borderRadius: "50%", minWidth: 28, minHeight: 28 }}><ChevronRight fontSize="small" /></IconButton>}
      {viewing && <PhotoViewer
        entryId={entry.id}
        photos={photos}
        photo={viewing}
        onPhotoChange={setViewing}
        onClose={() => setViewing(null)}
      />}
    </Box>
  );
}

/** Loads a private image as a temporary object URL and revokes it on unmount. */
export function usePrivateImage(entryId: number, attachmentId: string) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    let objectUrl: string | null = null;
    MoodMediaApi.getContent(entryId, attachmentId).then((blob) => {
      objectUrl = URL.createObjectURL(blob);
      if (live) setUrl(objectUrl); else URL.revokeObjectURL(objectUrl);
    }).catch(() => undefined);
    return () => { live = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [entryId, attachmentId]);
  return url;
}

/** 44px private-photo thumbnail that opens the viewer. Not itself tabbable: the strip's roving focus owns Tab. */
function PhotoThumb({ entryId, photo, label, onOpen }: { entryId: number; photo: MoodMediaAttachment; label: string; onOpen: () => void }) {
  const url = usePrivateImage(entryId, photo.id);
  return (
    <Box component="button" type="button" tabIndex={-1} aria-label={label} onClick={onOpen}
      sx={{ width: 44, height: 44, p: 0, border: "1px solid var(--al-theme-border)", borderRadius: "8px", overflow: "hidden", cursor: "pointer", bgcolor: "var(--al-theme-surface-raised)", display: "block" }}>
      {url && <Box component="img" src={url} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
    </Box>
  );
}

/** Viewport-constrained private-photo viewer with swipe, arrow-key, and visible button navigation. */
export function PhotoViewer({ entryId, photos, photo, onPhotoChange, onClose }: {
  entryId: number;
  photos: MoodMediaAttachment[];
  photo: MoodMediaAttachment;
  onPhotoChange: (photo: MoodMediaAttachment) => void;
  onClose: () => void;
}) {
  const index = photos.findIndex((item) => item.id === photo.id);
  const navigate = useCallback((nextIndex: number) => {
    const nextPhoto = photos[nextIndex];
    if (nextPhoto) onPhotoChange(nextPhoto);
  }, [onPhotoChange, photos]);
  const navigation = usePhotoViewerNavigation({ active: true, index, count: photos.length, onNavigate: navigate });
  const url = usePrivateImage(entryId, photo.id);
  return (
    <AuraModal
      open
      onClose={onClose}
      title="Photo"
      fullScreenBelow="sm"
      actions={<PhotoNavigationControls index={index} count={photos.length} onNavigate={navigate} />}
      actionsSx={{ justifyContent: "center" }}
    >
      <Box onTouchStart={navigation.onTouchStart} onTouchEnd={navigation.onTouchEnd} sx={{ touchAction: "pan-y" }}>
        {url ? <Box component="img" src={url} alt={photo.fileName} sx={{ display: "block", maxWidth: "100%", maxHeight: { xs: "min(45vh, 440px)", sm: "min(50vh, 560px)" }, mx: "auto", objectFit: "contain", borderRadius: "md" }} />
          : <Typography role="status" level="body-sm">Loading photo…</Typography>}
      </Box>
    </AuraModal>
  );
}
