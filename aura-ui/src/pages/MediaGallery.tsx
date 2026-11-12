import AddPhotoAlternateOutlined from "@mui/icons-material/AddPhotoAlternateOutlined";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import Box from "@mui/joy/Box";
import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { MoodMediaApi, type MoodMediaAttachment } from "@/api/MoodMediaApi";
import { MoodApi } from "@/api/MoodApi";
import { AuraButton } from "@/components/ui/AuraButton";
import { AuraModal } from "@/components/ui/AuraModal";
import type { MoodEntry } from "@/features/mood/models/schema";
import dayjs from "dayjs";

/** Formats a mood entry's ISO date (YYYY-MM-DD) for the entry picker, e.g. "Nov 10, 2026". */
const formatEntryDate = (date: string) => dayjs(date).format("MMM DD, YYYY");
import { ThemeBanner } from "@/components/ui/ThemeBanner";
import { prepareMoodPhoto } from "@/features/mood/utils/prepareMoodPhoto";

interface GalleryPhoto {
  attachment: MoodMediaAttachment;
  entry: MoodEntry;
}

/** Shows private uploaded photos in a theme-aware gallery with entry context and lightbox actions. */
export default function MediaGallery() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGallery = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const moodEntries = await MoodApi.getAllMoods();
      setEntries(moodEntries);
      setSelectedEntryId((current) => current ?? moodEntries[0]?.id ?? null);
      const results = await Promise.allSettled(
        moodEntries.map(async (entry) => ({ entry, attachments: await MoodMediaApi.getForMood(entry.id) })),
      );
      const loaded = results.flatMap((result) =>
        result.status === "fulfilled"
          ? result.value.attachments.map((attachment) => ({ attachment, entry: result.value.entry }))
          : [],
      );
      setPhotos(loaded.sort((a, b) => b.entry.date.localeCompare(a.entry.date) || b.attachment.createdAt.localeCompare(a.attachment.createdAt)));
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
    <Box className="signed-in-content" maxWidth={1120} mx="auto" mt={1}>
      <ThemeBanner title="Media Gallery" description="Private photos from your mood entries, gathered in one place." illustration="journal" />

      <Sheet className="aura-panel" variant="plain" sx={{ display: "flex", alignItems: { xs: "stretch", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 1.25, p: { xs: 1.5, sm: 2 }, mb: 2 }}>
        <Select
          aria-label="Mood entry for uploaded photos"
          placeholder="Choose a mood entry"
          value={selectedEntryId}
          onChange={(_, value) => setSelectedEntryId(value)}
          disabled={busy || entries.length === 0}
          // The 240px basis is a row-layout width; in the stacked mobile column it would become the height.
          sx={{ minWidth: 0, flex: { xs: "0 0 auto", sm: "1 1 240px" } }}
        >
          {entries.map((entry) => <Option key={entry.id} value={entry.id}>{formatEntryDate(entry.date)} · {entry.moods.join(", ")}</Option>)}
        </Select>
        <AuraButton component="label" variant="outlined" disabled={busy || !selectedEntry} startIcon={<AddPhotoAlternateOutlined />}>
          {busy ? "Working…" : "Upload photos"}
          <input type="file" accept="image/*,.heic,.heif" multiple aria-label="Upload photos to selected mood entry" onChange={handleUpload} disabled={busy || !selectedEntry} style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }} />
        </AuraButton>
      </Sheet>

      {error && <Sheet role="alert" className="aura-panel" variant="plain" sx={{ p: 1.5, mb: 2, borderColor: "rgba(173,75,67,.35)" }}><Typography color="danger">{error}</Typography></Sheet>}
      {loading && <Typography role="status" level="body-sm" sx={{ mb: 1.5 }}>Gathering your photos…</Typography>}
      {!loading && photos.length === 0 && <Sheet role="status" className="aura-panel" variant="plain" sx={{ p: { xs: 3, sm: 5 }, textAlign: "center" }}>
        <Typography level="h2">Your gallery is ready when you are.</Typography>
        <Typography level="body-md" color="neutral" sx={{ mt: 1 }}>Upload a photo to one of your saved mood entries to see it here.</Typography>
      </Sheet>}

      {!loading && photos.length > 0 && <Box component="section" aria-label="Uploaded mood photos" sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 176px), 1fr))", gap: { xs: 1, sm: 1.5 } }}>
        {photos.map((photo) => <GalleryTile key={photo.attachment.id} photo={photo} onOpen={() => setSelectedPhoto(photo)} />)}
      </Box>}

      <AuraModal
        open={selectedPhoto !== null}
        onClose={() => setSelectedPhoto(null)}
        title={selectedPhoto?.attachment.fileName ?? "Mood photo"}
        size="xl"
        contentSx={{ p: 0, backgroundColor: "var(--aura-dark, #222c27)" }}
        actions={selectedPhoto && <AuraButton color="danger" variant="outlined" startIcon={<DeleteOutline />} disabled={busy} onClick={() => void handleDelete(selectedPhoto)}>Delete photo</AuraButton>}
        actionsSx={{ justifyContent: "space-between", backgroundColor: "var(--aura-panel, #fffefa)", borderTop: "1px solid var(--aura-line)" }}
      >
        {selectedPhoto && <LightboxPhoto photo={selectedPhoto} />}
      </AuraModal>
    </Box>
  );
}

/** Opens a keyboard-accessible thumbnail and keeps its private image URL scoped to the tile. */
function GalleryTile({ photo, onOpen }: { photo: GalleryPhoto; onOpen: () => void }) {
  return <Sheet component="button" type="button" variant="plain" onClick={onOpen} aria-label={`Open ${photo.attachment.fileName}, ${photo.entry.moods.join(", ")}, ${photo.entry.date}`} sx={{ minWidth: 0, p: 0, overflow: "hidden", border: "1px solid var(--aura-line)", borderRadius: "lg", backgroundColor: "rgba(255,254,250,.68)", textAlign: "left", cursor: "pointer", transition: "transform .18s, box-shadow .18s", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 10px 28px rgba(34,44,39,.12)" }, "&:focus-visible": { outline: "3px solid var(--aura-accent)", outlineOffset: 2 } }}>
    <PrivatePhoto photo={photo} thumbnail />
    <Box sx={{ px: 1.25, py: 1, background: "linear-gradient(135deg, var(--aura-wash, rgba(135,164,186,.15)), rgba(255,254,250,.76))" }}>
      <Typography level="title-sm" noWrap>{photo.entry.moods.join(" · ") || "Mood"}</Typography>
      <Typography level="body-xs" color="neutral">{photo.entry.date}</Typography>
    </Box>
  </Sheet>;
}

/** Defers thumbnail downloads until near the viewport and releases their object URLs outside it; lightbox images load immediately. */
function PrivatePhoto({ photo, thumbnail }: { photo: GalleryPhoto; thumbnail: boolean }) {
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
  return <Box ref={thumbnail ? imageRegionRef : undefined} sx={{ display: "grid", placeItems: "center", width: "100%", height: thumbnail ? { xs: 132, sm: 168 } : "min(66vh, 720px)", backgroundColor: imageUrl ? "var(--aura-dark, #222c27)" : "var(--aura-wash, rgba(135,164,186,.15))" }}>
    {imageUrl
      ? <Box component="img" src={imageUrl} alt={thumbnail ? photo.attachment.fileName : `${photo.entry.moods.join(", ")} mood photo`} sx={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }} />
      : <Box role={failed || !shouldLoad ? "img" : "status"} aria-label={failed ? "Photo unavailable" : loadingLabel} sx={{ display: "grid", placeItems: "center", width: "100%", height: "100%" }}><Typography color={failed ? "danger" : "neutral"}>{failed ? "Photo unavailable" : shouldLoad ? "Loading photo…" : "Preview loads as you scroll"}</Typography></Box>}
  </Box>;
}

/** Displays mood, date, and a visibly truncated optional reflection beneath the expanded image. */
function LightboxPhoto({ photo }: { photo: GalleryPhoto }) {
  return <Box>
    <PrivatePhoto photo={photo} thumbnail={false} />
    <Box sx={{ px: { xs: 1.5, sm: 2.5 }, py: 1.5, color: "#242B27", background: "linear-gradient(135deg, rgba(255,254,250,.98), var(--aura-panel, rgba(255,254,250,.94)))", borderTop: "3px solid var(--aura-accent, #87917B)" }}>
      <Typography level="title-md" sx={{ color: "#242B27", fontWeight: 700 }}>{photo.entry.moods.join(" · ") || "Mood entry"}</Typography>
      <Typography level="body-sm" sx={{ color: "#626B64" }}>{photo.entry.date}</Typography>
      {photo.entry.comment && <Typography title={photo.entry.comment} level="body-sm" sx={{ mt: 0.75, color: "#242B27", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden", overflowWrap: "anywhere" }}>{photo.entry.comment}</Typography>}
    </Box>
  </Box>;
}
