import { CircularProgress } from "@mui/material";
import { AuraButton as Button } from "@/components/ui/AuraButton";
import { useRef, useState } from "react";
import MoodEntryFormFields from "./MoodEntryFormFields";
import type { MoodType } from "../features/mood/models/schema";
import { useToast } from "../hooks/useToast";
import type { MoodEntry } from "../features/mood/models/schema";
import { AuraModal } from "./ui/AuraModal";
import { MoodApi } from "../api/MoodApi";
import { MoodMediaApi } from "../api/MoodMediaApi";

type PhotoStatus = "pending" | "uploaded" | "failed";

/** Updates an existing mood first, then attaches private photos to that same entry with retry support. */
export default function MoodUpdateModal({
  entry,
  onClose,
  onSuccess,
  title = "Edit Mood Entry",
  saveLabel = "Update",
}: {
  entry: MoodEntry;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  saveLabel?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [entrySaved, setEntrySaved] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; role: "alert" | "status" } | null>(null);
  const [photoStatuses, setPhotoStatuses] = useState<PhotoStatus[]>([]);
  const updateStarted = useRef(false);
  const { showToast } = useToast();

  /** Prevents an update retry from resubmitting the mood after a partial photo-upload failure. */
  const handleSubmit = async (data: {
    date: string;
    moods: MoodType[];
    impactTopics: string[];
    comment?: string;
  }, photos: File[]) => {
    if (updateStarted.current) return;
    updateStarted.current = true;
    setLoading(true);
    setFeedback(null);
    try {
      if (!entrySaved) {
        if (!data.moods.length || !data.date) throw new Error("Mood and date are required.");
        await MoodApi.updateMood(entry.id, {
          date: data.date,
          moods: data.moods,
          impactTopics: data.impactTopics,
          comment: data.comment ?? "",
        });
        setEntrySaved(true);
      }

      const statuses = photoStatuses.length === photos.length
        ? [...photoStatuses]
        : photos.map((_, index) => photoStatuses[index] ?? "pending");
      for (let index = 0; index < photos.length; index += 1) {
        if (statuses[index] === "uploaded") continue;
        setFeedback({ message: `Your note is saved. Adding photo ${index + 1} of ${photos.length}…`, role: "status" });
        try {
          await MoodMediaApi.upload(entry.id, photos[index]);
          statuses[index] = "uploaded";
        } catch {
          statuses[index] = "failed";
        }
        setPhotoStatuses([...statuses]);
      }

      const failedCount = statuses.filter((status) => status === "failed").length;
      if (failedCount) {
        setFeedback({
          message: `${failedCount} photo${failedCount === 1 ? "" : "s"} could not be added. Retry to continue.`,
          role: "alert",
        });
        return;
      }

      showToast(photos.length ? "Your note and private photos were saved." : "Mood entry updated successfully.", "success");
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update mood entry.";
      setFeedback({ message, role: "alert" });
    } finally {
      updateStarted.current = false;
      setLoading(false);
    }
  };

  return (
    <AuraModal
      open
      onClose={onClose}
      title={title}
      size="lg"
      layout="top"
      contentSx={{ maxHeight: "calc(100vh - 190px)", overflowY: "auto" }}
      actions={
        <>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            onClick={() => (document.getElementById("mood-form") as HTMLFormElement | null)?.requestSubmit()}
            disabled={loading}
            type="button"
          >
            {loading ? <CircularProgress size={16} /> : entrySaved ? "Retry failed photos" : saveLabel}
          </Button>
        </>
      }
    >
      <MoodEntryFormFields
        entry={entry}
        showSubmitButton={false}
        onSubmit={handleSubmit}
        disabled={entrySaved}
        isSubmitting={loading}
        statusMessage={feedback?.message}
        statusRole={feedback?.role}
        photoStatuses={photoStatuses}
      />
    </AuraModal>
  );
}
