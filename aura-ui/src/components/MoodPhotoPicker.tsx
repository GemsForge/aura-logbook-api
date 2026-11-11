import AddPhotoAlternateOutlined from "@mui/icons-material/AddPhotoAlternateOutlined";
import CloseRounded from "@mui/icons-material/CloseRounded";
import Box from "@mui/joy/Box";
import IconButton from "@mui/joy/IconButton";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { AuraButton } from "@/components/ui/AuraButton";
import { prepareMoodPhoto } from "@/features/mood/utils/prepareMoodPhoto";

/** Provides accessible local photo selection, preparation, preview, and removal before a mood is saved. */
export interface MoodPhotoPickerProps {
  /** Receives browser-prepared JPEG files in the same order as their previews. */
  onChange: (photos: File[]) => void;
  /** Locks selection while a mood or its photos are being saved. */
  disabled?: boolean;
  /** Shows the result for each uploaded photo without exposing media URLs. */
  statuses?: Array<"pending" | "uploaded" | "failed">;
}

type SelectedPhoto = { id: string; file: File; previewUrl: string };

/** Reuses the gallery's image preparation rules and enforces its ten-photo entry limit. */
export default function MoodPhotoPicker({ onChange, disabled = false, statuses = [] }: MoodPhotoPickerProps) {
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const previewUrls = useRef(new Set<string>());
  const nextPhotoId = useRef(0);

  useEffect(() => () => {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrls.current.clear();
  }, []);

  const handleSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (selected.length === 0) return;

    const available = Math.max(0, 10 - photos.length);
    const accepted = selected.slice(0, available);
    setError(selected.length > available ? "A mood entry can include up to 10 photos." : null);
    if (accepted.length === 0) return;

    const prepared: SelectedPhoto[] = [];
    setPreparing(true);
    try {
      for (const file of accepted) {
        try {
          const preparedFile = await prepareMoodPhoto(file);
          const previewUrl = URL.createObjectURL(preparedFile);
          previewUrls.current.add(previewUrl);
          nextPhotoId.current += 1;
          prepared.push({ id: `photo-${nextPhotoId.current}`, file: preparedFile, previewUrl });
        } catch (photoError) {
          setError(photoError instanceof Error ? photoError.message : "This photo could not be prepared.");
        }
      }
    } finally {
      setPreparing(false);
    }
    if (prepared.length > 0) {
      const updated = [...photos, ...prepared];
      setPhotos(updated);
      onChange(updated.map(({ file }) => file));
    }
  };

  const removePhoto = (id: string) => {
    const removed = photos.find((photo) => photo.id === id);
    if (removed) {
      URL.revokeObjectURL(removed.previewUrl);
      previewUrls.current.delete(removed.previewUrl);
    }
    const updated = photos.filter((photo) => photo.id !== id);
    setPhotos(updated);
    onChange(updated.map(({ file }) => file));
  };

  return (
    <Box component="section" aria-label="Photos for this mood entry">
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
        <Box>
          <Typography level="title-sm">Add photos (optional)</Typography>
          <Typography level="body-xs" color="neutral">Private to your account · Up to 10 photos</Typography>
        </Box>
        <AuraButton component="label" variant="outlined" size="small" disabled={disabled || preparing || photos.length >= 10} startIcon={<AddPhotoAlternateOutlined />}>
          Choose photos
          <input type="file" accept="image/*,.heic,.heif" multiple aria-label="Choose mood photos" disabled={disabled || preparing || photos.length >= 10} onChange={handleSelection} style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }} />
        </AuraButton>
      </Box>
      {preparing && <Typography role="status" level="body-sm" color="neutral" sx={{ mt: 1 }}>Preparing selected photos…</Typography>}
      {error && <Typography role="alert" level="body-sm" color="danger" sx={{ mt: 1 }}>{error}</Typography>}
      {photos.length > 0 && (
        <Box role="list" aria-label="Selected mood photos" sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.5 }}>
          {photos.map((photo, index) => (
            <Sheet key={photo.id} role="listitem" variant="outlined" sx={{ position: "relative", width: 132, overflow: "hidden", borderRadius: "md", backgroundColor: "var(--al-theme-surface)" }}>
              <Box component="img" src={photo.previewUrl} alt={`Preview of ${photo.file.name}`} sx={{ display: "block", width: "100%", height: 96, objectFit: "cover" }} />
              {!disabled && <IconButton size="sm" variant="soft" color="neutral" aria-label={`Remove ${photo.file.name}`} onClick={() => removePhoto(photo.id)} sx={{ position: "absolute", top: 4, right: 4, backgroundColor: "var(--al-theme-surface)" }}><CloseRounded fontSize="small" /></IconButton>}
              <Typography level="body-xs" sx={{ display: "block", px: 0.75, py: 0.5, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{photo.file.name}</Typography>
              {statuses[index] && <Typography level="body-xs" role={statuses[index] === "failed" ? "alert" : "status"} color={statuses[index] === "failed" ? "danger" : statuses[index] === "uploaded" ? "success" : "neutral"} sx={{ display: "block", px: 0.75, pb: 0.5 }}>{statuses[index] === "uploaded" ? "Uploaded" : statuses[index] === "failed" ? "Upload failed" : "Ready"}</Typography>}
            </Sheet>
          ))}
        </Box>
      )}
    </Box>
  );
}
