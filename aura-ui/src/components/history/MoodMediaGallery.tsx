import AddPhotoAlternateOutlined from "@mui/icons-material/AddPhotoAlternateOutlined";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import Box from "@mui/joy/Box";
import IconButton from "@mui/joy/IconButton";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { AuraButton } from "@/components/ui/AuraButton";
import { MoodMediaApi, type MoodMediaAttachment } from "@/api/MoodMediaApi";
import { prepareMoodPhoto } from "@/features/mood/utils/prepareMoodPhoto";

/** Loads private images on demand and manages attachments for one saved mood entry. */
export default function MoodMediaGallery({ moodEntryId }: { moodEntryId: number }) {
  const [attachments, setAttachments] = useState<MoodMediaAttachment[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const loadAttachments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAttachments(await MoodMediaApi.getForMood(moodEntryId));
    } catch {
      setError("Could not load this entry’s private photos.");
    } finally {
      setLoading(false);
    }
  }, [moodEntryId]);

  useEffect(() => {
    if (expanded) void loadAttachments();
  }, [expanded, loadAttachments, refreshToken]);

  /** Sends a selected photo to the owner-checked API and refreshes the private gallery. */
  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setBusy(true);
    setError(null);
    try {
      const preparedFile = await prepareMoodPhoto(file);
      await MoodMediaApi.upload(moodEntryId, preparedFile);
      setRefreshToken((current) => current + 1);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Photo upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  /** Confirms removal before deleting the private file and metadata. */
  const handleDelete = async (attachment: MoodMediaAttachment) => {
    if (!window.confirm(`Remove ${attachment.fileName} from this mood entry?`)) return;
    setBusy(true);
    setError(null);
    try {
      await MoodMediaApi.delete(moodEntryId, attachment.id);
      setRefreshToken((current) => current + 1);
    } catch {
      setError("Could not remove this photo. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box component="section" aria-label="Private mood photos" sx={{ mt: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
        
        <AuraButton
          variant="outlined"
          size="small"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Done" : "Manage photos"}
        </AuraButton>
        {expanded && attachments.length < 10 && (
          <AuraButton
            component="label"
            variant="outlined"
            size="small"
            disabled={busy}
            startIcon={<AddPhotoAlternateOutlined />}
          >
            Add photo
            <input
              type="file"
              accept="image/*,.heic,.heif"
              aria-label="Choose a private photo"
              onChange={handleUpload}
              disabled={busy}
              style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }}
            />
          </AuraButton>
        )}
      </Box>
      {/* Upload rules matter only while adding photos, so they show with the expanded gallery rather than on every card. */}
      {expanded && <>
        <Typography level="body-xs" color="neutral" sx={{ mt: 0.5 }}>
          Private to your account · Large photos are resized and converted to JPEG before upload · 10 per entry
        </Typography>
        {loading && <Typography role="status" level="body-xs" sx={{ mt: 1 }}>Loading private photos…</Typography>}
        {error && <Typography role="alert" level="body-xs" color="danger" sx={{ mt: 1 }}>{error}</Typography>}
        {!loading && attachments.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.5 }}>
            {attachments.map((attachment) => (
              <PrivateMoodImage
                key={attachment.id}
                moodEntryId={moodEntryId}
                attachment={attachment}
                disabled={busy}
                onDelete={() => handleDelete(attachment)}
              />
            ))}
          </Box>
        )}
      </>}
    </Box>
  );
}

/** Fetches one image through the private API and revokes its temporary browser URL on cleanup. */
function PrivateMoodImage({
  moodEntryId,
  attachment,
  disabled,
  onDelete,
}: {
  moodEntryId: number;
  attachment: MoodMediaAttachment;
  disabled: boolean;
  onDelete: () => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    MoodMediaApi.getContent(moodEntryId, attachment.id)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (active) setImageUrl(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.id, moodEntryId]);

  return (
    <Sheet variant="outlined" sx={{ position: "relative", width: 132, minHeight: 104, overflow: "hidden", borderRadius: "md", borderColor: "var(--aura-line)", backgroundColor: "var(--al-theme-surface)" }}>
      {imageUrl ? (
        <Box component="img" src={imageUrl} alt={attachment.fileName} sx={{ display: "block", width: "100%", height: 104, objectFit: "cover" }} />
      ) : (
        <Box sx={{ display: "grid", placeItems: "center", width: "100%", height: 104, p: 1 }}>
          <Typography level="body-xs" color={failed ? "danger" : "neutral"} textAlign="center">
            {failed ? "Photo unavailable" : "Loading photo…"}
          </Typography>
        </Box>
      )}
      <IconButton
        size="sm"
        variant="soft"
        color="neutral"
        aria-label={`Remove photo ${attachment.fileName}`}
        disabled={disabled}
        onClick={onDelete}
        sx={{ position: "absolute", top: 4, right: 4, backgroundColor: "var(--al-theme-surface)" }}
      >
        <DeleteOutline fontSize="small" />
      </IconButton>
      <Typography level="body-xs" sx={{ display: "block", px: 0.75, py: 0.5, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
        {attachment.fileName}
      </Typography>
    </Sheet>
  );
}
