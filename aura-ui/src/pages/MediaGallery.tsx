import AddPhotoAlternateOutlined from "@mui/icons-material/AddPhotoAlternateOutlined";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import Box from "@mui/joy/Box";
import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import Sheet from "@mui/joy/Sheet";
import ToggleButtonGroup from "@mui/joy/ToggleButtonGroup";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import PhotoNavigationControls from "@/components/history/PhotoNavigationControls";
import { usePhotoViewerNavigation } from "@/components/history/photoViewerNavigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type SyntheticEvent } from "react";
import { MoodMediaApi, type MoodMediaAttachment } from "@/api/MoodMediaApi";
import { MoodApi } from "@/api/MoodApi";
import { AuraButton } from "@/components/ui/AuraButton";
import { AuraModal } from "@/components/ui/AuraModal";
import type { MoodEntry } from "@/features/mood/models/schema";
import { prepareMoodPhoto } from "@/features/mood/utils/prepareMoodPhoto";

interface GalleryPhoto {
  attachment: MoodMediaAttachment;
  entry: MoodEntry;
}

type GalleryLayout = "mosaic" | "grid";
type GallerySort = "newest" | "oldest";

interface PhotoDimensions {
  width: number;
  height: number;
}

/** Browser-local key for the gallery's Mosaic/Grid preference. */
const GALLERY_LAYOUT_STORAGE_KEY = "aura.mediaGallery.layout";

/** Restores only known gallery layouts; storage failures use the Mosaic default. */
function readStoredGalleryLayout(): GalleryLayout {
  try {
    const saved = localStorage.getItem(GALLERY_LAYOUT_STORAGE_KEY);
    return saved === "grid" ? "grid" : "mosaic";
  } catch {
    return "mosaic";
  }
}

/** Shows private uploaded photos in a theme-aware gallery with entry context and lightbox actions. */
export default function MediaGallery() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [moodFilter, setMoodFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<GallerySort>("newest");
  const [galleryLayout, setGalleryLayout] = useState<GalleryLayout>(readStoredGalleryLayout);
  const [photoDimensions, setPhotoDimensions] = useState<Record<string, PhotoDimensions>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGallery = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const moodEntries = await MoodApi.getAllMoods();
      setEntries(moodEntries);
      setSelectedEntryId((current) => moodEntries.some((entry) => entry.id === current) ? current : null);
      const results = await Promise.allSettled(
        moodEntries.map(async (entry) => ({ entry, attachments: await MoodMediaApi.getForMood(entry.id) })),
      );
      const loaded = results.flatMap((result) =>
        result.status === "fulfilled"
          ? result.value.attachments.map((attachment) => ({ attachment, entry: result.value.entry }))
          : [],
      );
      setPhotos(loaded);
      if (results.some((result) => result.status === "rejected")) {
        setError("Some photos could not be loaded. Try refreshing the gallery.");
      }
    } catch {
      setError("We couldn’t load your media gallery.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadGallery(); }, [loadGallery]);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedEntryId) ?? null,
    [entries, selectedEntryId],
  );

  /** Saves the layout choice between route changes while keeping the current session usable if storage is blocked. */
  const chooseGalleryLayout = (next: GalleryLayout) => {
    setGalleryLayout(next);
    try { localStorage.setItem(GALLERY_LAYOUT_STORAGE_KEY, next); } catch { /* the selected layout still applies for this visit */ }
  };

  /** Keeps mosaic tiles at each image's natural ratio while the grid view uses uniform thumbnails. */
  const handlePhotoDimensions = useCallback((attachmentId: string, width: number, height: number) => {
    if (!width || !height) return;
    setPhotoDimensions((current) => current[attachmentId]?.width === width && current[attachmentId]?.height === height
      ? current
      : { ...current, [attachmentId]: { width, height } });
  }, []);

  /** Applies the visible mood filter and sort choice without changing the gallery's source order. */
  const visiblePhotos = useMemo(() => {
    const matching = photos.filter((photo) => moodFilter === "all" || photo.entry.moods.includes(moodFilter));
    return matching.sort((a, b) => {
      const byDate = a.entry.date.localeCompare(b.entry.date) || a.attachment.createdAt.localeCompare(b.attachment.createdAt);
      return sortOrder === "newest" ? -byDate : byDate;
    });
  }, [moodFilter, photos, sortOrder]);

  const availableMoods = useMemo(
    () => Array.from(new Set(entries.flatMap((entry) => entry.moods))).sort((a, b) => a.localeCompare(b)),
    [entries],
  );

  const selectedPhotoIndex = selectedPhoto
    ? visiblePhotos.findIndex((photo) => photo.attachment.id === selectedPhoto.attachment.id)
    : -1;
  const navigateGalleryPhoto = useCallback((nextIndex: number) => {
    const nextPhoto = visiblePhotos[nextIndex];
    if (nextPhoto) setSelectedPhoto(nextPhoto);
  }, [visiblePhotos]);
  const photoNavigation = usePhotoViewerNavigation({
    active: selectedPhoto !== null,
    index: selectedPhotoIndex,
    count: visiblePhotos.length,
    onNavigate: navigateGalleryPhoto,
  });

  /** Prepares selected files, then uploads each to the chosen saved mood within its ten-photo limit. */
  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!selectedEntry || files.length === 0) return;
    const existingCount = photos.filter((photo) => photo.entry.id === selectedEntry.id).length;
    const allowedFiles = files.slice(0, Math.max(0, 10 - existingCount));
    if (allowedFiles.length === 0) {
      setError("This entry already has the maximum of 10 photos.");
      return;
    }
    setBusy(true);
    setError(files.length > allowedFiles.length ? "Only the remaining photo slots were uploaded (10 per entry maximum)." : null);
    try {
      for (const file of allowedFiles) {
        const prepared = await prepareMoodPhoto(file);
        await MoodMediaApi.upload(selectedEntry.id, prepared);
      }
      await loadGallery();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? `${uploadError.message} Earlier photos may have uploaded successfully.` : "Some photos could not be uploaded. Earlier photos may have uploaded successfully.");
      await loadGallery();
    } finally {
      setBusy(false);
    }
  };

  /** Confirms and removes the selected private image, then refreshes the gallery metadata. */
  const handleDelete = async (photo: GalleryPhoto) => {
    if (!window.confirm(`Remove ${photo.attachment.fileName} from this mood entry?`)) return;
    setBusy(true);
    setError(null);
    try {
      await MoodMediaApi.delete(photo.entry.id, photo.attachment.id);
      setSelectedPhoto(null);
      await loadGallery();
    } catch {
      setError("Could not remove this photo. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box maxWidth={1120} mx="auto" mt={1}>
      <Typography className="aura-eyebrow" color="neutral" sx={{ mb: 1.5 }}>Moments you’ve kept</Typography>
      <Typography component="h1" level="h1" className="aura-page-heading" sx={{ mb: 1 }}>Media Gallery</Typography>
      <Typography level="body-lg" color="neutral" sx={{ mb: 2.5 }}>Private photos from your mood entries, gathered in one place.</Typography>

      <Sheet className="aura-panel" variant="plain" sx={{ display: "flex", alignItems: { xs: "stretch", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 1.25, p: { xs: 1.5, sm: 2 }, mb: 2 }}>
        <Box sx={{ minWidth: 0, width: "100%", maxWidth: { sm: 640 }, flex: { xs: "1 1 auto", sm: "1 1 300px" } }}>
          <Typography level="body-sm" sx={{ mb: 0.5 }}>Add photos to</Typography>
          <Select
            aria-label="Mood entry to attach new photos to"
            placeholder="Choose a mood entry"
            value={selectedEntryId}
            onChange={(_, value) => setSelectedEntryId(value)}
            disabled={busy || entries.length === 0}
            sx={{ minWidth: 0, width: "100%" }}
            slotProps={{
              button: { sx: { color: "var(--al-theme-ink)", backgroundColor: "var(--al-theme-surface-raised)", borderColor: "var(--al-theme-control-border)", "&:hover": { backgroundColor: "var(--al-theme-surface-raised)" } } },
              listbox: { sx: { color: "var(--al-theme-ink)", backgroundColor: "var(--al-theme-surface-raised)", borderColor: "var(--al-theme-control-border)" } },
            }}
          >
            {entries.map((entry) => <Option key={entry.id} value={entry.id} sx={{ color: "var(--al-theme-ink)" }}>{entry.date} · {entry.moods.join(", ")}</Option>)}
          </Select>
          <Typography level="body-xs" color="neutral" sx={{ mt: 0.5 }}>
            {entries.length ? "Photos will appear with this saved mood entry." : "Create a mood entry before adding photos."}
          </Typography>
        </Box>
        <AuraButton component="label" variant="outlined" disabled={busy || !selectedEntry} startIcon={<AddPhotoAlternateOutlined />}>
          {busy ? "Adding…" : "Add photos"}
          <input type="file" accept="image/*,.heic,.heif" multiple aria-label="Choose photos to add to the selected mood entry" onChange={handleUpload} disabled={busy || !selectedEntry} style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }} />
        </AuraButton>
      </Sheet>

      {error && <Sheet role="alert" className="aura-panel" variant="plain" sx={{ p: 1.5, mb: 2, borderColor: "rgba(173,75,67,.35)" }}><Typography color="danger">{error}</Typography></Sheet>}
      {loading && <Typography role="status" level="body-sm" sx={{ mb: 1.5 }}>Gathering your photos…</Typography>}
      {!loading && photos.length === 0 && <Sheet role="status" className="aura-panel" variant="plain" sx={{ p: { xs: 3, sm: 5 }, textAlign: "center" }}>
        <Typography level="h2">Your gallery is ready when you are.</Typography>
        <Typography level="body-md" color="neutral" sx={{ mt: 1 }}>Upload a photo to one of your saved mood entries to see it here.</Typography>
      </Sheet>}

      {!loading && photos.length > 0 && <Box component="section" aria-label="Uploaded mood photos" sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 176px), 1fr))", gap: { xs: 1, sm: 1.5 } }}>
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, gridColumn: "1 / -1", mb: 0.25 }}>
          <Select aria-label="Filter photos by mood" value={moodFilter} onChange={(_, value) => value && setMoodFilter(value)} size="sm" sx={{ minWidth: 144 }}>
            <Option value="all">All moods</Option>
            {availableMoods.map((mood) => <Option key={mood} value={mood}>{mood}</Option>)}
          </Select>
          <Select aria-label="Sort photos" value={sortOrder} onChange={(_, value) => {
            if (value === "newest" || value === "oldest") setSortOrder(value);
          }} size="sm" sx={{ minWidth: 156 }}>
            <Option value="newest">Newest first</Option>
            <Option value="oldest">Oldest first</Option>
          </Select>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, gridColumn: "1 / -1", mb: 0.25 }}>
          <Typography level="body-sm" color="neutral">{visiblePhotos.length} {visiblePhotos.length === 1 ? "photo" : "photos"}</Typography>
          <ToggleButtonGroup
            aria-label="Gallery layout"
            value={galleryLayout}
    onChange={(_, value) => {
              if (value === "mosaic" || value === "grid") chooseGalleryLayout(value);
            }}
            size="sm"
            variant="soft"
            sx={{ borderRadius: 999, "& button": { borderRadius: 999, minHeight: 36, px: 1.5 } }}
          >
            <Button value="mosaic" aria-label="Mosaic layout">Mosaic</Button>
            <Button value="grid" aria-label="Grid layout">Grid</Button>
          </ToggleButtonGroup>
        </Box>
        {visiblePhotos.length === 0
          ? <Sheet role="status" className="aura-panel" variant="plain" sx={{ gridColumn: "1 / -1", p: 2, textAlign: "center" }}>
            <Typography level="body-md">No photos match this mood.</Typography>
            <Button variant="plain" onClick={() => setMoodFilter("all")}>Show all photos</Button>
          </Sheet>
          : <Box sx={{
          gridColumn: "1 / -1",
          ...(galleryLayout === "mosaic"
            ? { columnCount: { xs: 2, sm: 3, lg: 4 }, columnGap: "4px" }
            : { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 176px), 1fr))", gap: "4px" }),
        }}>
          {visiblePhotos.map((photo) => <GalleryTile
            key={photo.attachment.id}
            photo={photo}
            layout={galleryLayout}
            aspectRatio={photoDimensions[photo.attachment.id]
              ? photoDimensions[photo.attachment.id].width / photoDimensions[photo.attachment.id].height
              : undefined}
            onDimensions={handlePhotoDimensions}
            onOpen={() => setSelectedPhoto(photo)}
          />)}
        </Box>}
      </Box>}

      <AuraModal
        open={selectedPhoto !== null}
        onClose={() => setSelectedPhoto(null)}
        title="Mood photo details"
        hideTitle
        size="xl"
        fullScreenBelow="sm"
        contentSx={{ p: 0, backgroundColor: "var(--aura-dark, #222c27)" }}
        actions={selectedPhoto && <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, width: "100%" }}>
          <PhotoNavigationControls index={selectedPhotoIndex} count={visiblePhotos.length} onNavigate={navigateGalleryPhoto} />
          <AuraButton color="danger" variant="outlined" startIcon={<DeleteOutline />} disabled={busy} onClick={() => void handleDelete(selectedPhoto)}>Delete photo</AuraButton>
        </Box>}
        actionsSx={{ justifyContent: "space-between", backgroundColor: "var(--aura-panel, #fffefa)", borderTop: "1px solid var(--aura-line)" }}
      >
        {selectedPhoto && <Box onTouchStart={photoNavigation.onTouchStart} onTouchEnd={photoNavigation.onTouchEnd} sx={{ touchAction: "pan-y" }}>
          <LightboxPhoto
            photo={selectedPhoto}
            dimensions={photoDimensions[selectedPhoto.attachment.id]}
            onDimensions={handlePhotoDimensions}
          />
        </Box>}
      </AuraModal>
    </Box>
  );
}

/** Opens a keyboard-accessible image tile; mosaic tiles retain natural proportions and grid tiles crop uniformly. */
function GalleryTile({ photo, layout, aspectRatio, onDimensions, onOpen }: {
  photo: GalleryPhoto;
  layout: GalleryLayout;
  aspectRatio?: number;
  onDimensions: (attachmentId: string, width: number, height: number) => void;
  onOpen: () => void;
}) {
  const moodLabel = photo.entry.moods.join(" · ") || "Mood";
  return <Sheet component="button" type="button" variant="plain" onClick={onOpen} aria-label={`Open ${photo.attachment.fileName}, ${moodLabel}, ${photo.entry.date}`} sx={{
    display: "block", width: "100%", minWidth: 0, p: 0, mb: layout === "mosaic" ? "4px" : 0,
    overflow: "hidden", position: "relative", border: 0, borderRadius: "2px", backgroundColor: "var(--aura-wash)",
    textAlign: "left", breakInside: "avoid", verticalAlign: "top",
    "&:focus-visible": { outline: "3px solid var(--al-theme-focus)", outlineOffset: 2 },
  }}>
    <PrivatePhoto photo={photo} thumbnail layout={layout} aspectRatio={aspectRatio} onDimensions={onDimensions} />
    <Box sx={{ position: "absolute", inset: "auto 0 0", px: 1, pt: 2.5, pb: 0.75, color: "#fff", background: "linear-gradient(transparent, rgba(24, 31, 26, .76))", pointerEvents: "none" }}>
      <Typography level="title-sm" noWrap sx={{ color: "inherit", fontSize: "0.8rem" }}>{moodLabel}</Typography>
      <Typography level="body-xs" sx={{ color: "rgba(255,255,255,.88)" }}>{photo.entry.date}</Typography>
    </Box>
  </Sheet>;
}

/** Defers thumbnail downloads near the viewport, releases unused object URLs, and sharply caps expanded images to keep details and actions in view. */
function PrivatePhoto({ photo, thumbnail, layout, aspectRatio, onDimensions }: {
  photo: GalleryPhoto;
  thumbnail: boolean;
  layout?: GalleryLayout;
  aspectRatio?: number;
  onDimensions?: (attachmentId: string, width: number, height: number) => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(!thumbnail);
  const imageRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!thumbnail) return;
    const target = imageRegionRef.current;
    if (!target) return;
    if (!("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        setImageUrl(null);
        setFailed(false);
      }
      setShouldLoad(entry.isIntersecting);
    }, { rootMargin: "240px 0px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [thumbnail]);

  useEffect(() => {
    if (!shouldLoad) return;
    let active = true;
    let objectUrl: string | null = null;
    MoodMediaApi.getContent(photo.entry.id, photo.attachment.id).then((blob) => {
      objectUrl = URL.createObjectURL(blob);
      if (active) setImageUrl(objectUrl);
      else URL.revokeObjectURL(objectUrl);
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [photo.attachment.id, photo.entry.id, shouldLoad]);
  const loadingLabel = shouldLoad ? "Loading photo" : "Photo preview loads as you scroll";
  return <Box ref={thumbnail ? imageRegionRef : undefined} sx={{
    display: "grid", placeItems: "center", width: "100%",
    height: thumbnail ? "auto" : { xs: "min(45vh, 440px)", sm: "min(50vh, 560px)" },
    aspectRatio: thumbnail ? (layout === "grid" ? "4 / 3" : aspectRatio ?? "4 / 3") : undefined,
    backgroundColor: imageUrl ? "var(--aura-dark, #222c27)" : "var(--aura-wash, rgba(135,164,186,.15))",
  }}>
    {imageUrl
      ? <Box component="img" src={imageUrl} alt={thumbnail ? photo.attachment.fileName : `${photo.entry.moods.join(", ")} mood photo`} onLoad={(event: SyntheticEvent<HTMLImageElement>) => onDimensions?.(photo.attachment.id, event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)} sx={{ display: "block", width: "100%", height: "100%", maxHeight: thumbnail ? "100%" : { xs: "min(45vh, 440px)", sm: "min(50vh, 560px)" }, objectFit: thumbnail ? "cover" : "contain" }} />
      : <Box role={failed || !shouldLoad ? "img" : "status"} aria-label={failed ? "Photo unavailable" : loadingLabel} sx={{ display: "grid", placeItems: "center", width: "100%", height: "100%" }}><Typography color={failed ? "danger" : "neutral"}>{failed ? "Photo unavailable" : shouldLoad ? "Loading photo…" : "Preview loads as you scroll"}</Typography></Box>}
  </Box>;
}

/** Displays mood, date, and a visibly truncated optional reflection beneath the expanded image. */
function LightboxPhoto({ photo, dimensions, onDimensions }: {
  photo: GalleryPhoto;
  dimensions?: PhotoDimensions;
  onDimensions: (attachmentId: string, width: number, height: number) => void;
}) {
  return <Box>
    <PrivatePhoto photo={photo} thumbnail={false} onDimensions={onDimensions} />
    <Box sx={{ px: { xs: 1.5, sm: 2.5 }, py: 1.5, color: "#242B27", background: "linear-gradient(135deg, rgba(255,254,250,.98), var(--aura-panel, rgba(255,254,250,.94)))", borderTop: "3px solid var(--aura-accent, #87917B)" }}>
      <Typography level="title-md" sx={{ color: "#242B27", fontWeight: 700 }}>{photo.entry.moods.join(" · ") || "Mood entry"}</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: 1.25, rowGap: 0.25, mt: 0.25 }}>
        <Typography level="body-sm" sx={{ color: "#626B64" }}>{photo.entry.date}</Typography>
        {dimensions && <Typography level="body-xs" sx={{ color: "#626B64" }}>{dimensions.width} × {dimensions.height} px</Typography>}
        <Typography level="body-xs" sx={{ color: "#626B64" }}>{formatFileSize(photo.attachment.byteLength)}</Typography>
      </Box>
      {photo.entry.comment && <Typography title={photo.entry.comment} level="body-sm" sx={{ mt: 0.75, color: "#242B27", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden", overflowWrap: "anywhere" }}>{photo.entry.comment}</Typography>}
    </Box>
  </Box>;
}

/** Formats an uploaded image's byte count as a compact modal detail. */
function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} bytes`;
}
