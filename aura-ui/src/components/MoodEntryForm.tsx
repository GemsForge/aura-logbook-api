import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import { MoodApi } from "../api/MoodApi";
import type { MoodType } from "../features/mood/models/schema/MoodType";
import MoodEntryFormFields from "./MoodEntryFormFields";
import { useToast } from "../hooks/useToast";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { ThemeBanner } from "@/components/ui/ThemeBanner";
import { MoodMediaApi } from "@/api/MoodMediaApi";

/** Hosts mood creation in a compact card while preserving the circular mood selector. */
export default function MoodEntryForm() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedMoodId, setSavedMoodId] = useState<number | null>(null);
  const [photoStatuses, setPhotoStatuses] = useState<Array<"pending" | "uploaded" | "failed">>([]);
  const [feedback, setFeedback] = useState<{ message: string; role: "alert" | "status" } | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const submitInProgress = useRef(false);

  /** Saves one entry first, then uploads its private photos with retry state tied to that entry ID. */
  const handleSubmit = async (data: {
    date: string;
    moods: MoodType[];
    comment?: string;
  }, photos: File[]) => {
    if (submitInProgress.current) return;
    submitInProgress.current = true;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      let moodEntryId = savedMoodId;
      let nextPhotoStatuses = photoStatuses.length === photos.length
        ? [...photoStatuses]
        : photos.map(() => "pending" as const);

      if (moodEntryId === null) {
        setSaveFailed(false);
        setFeedback({ message: "Saving your check-in…", role: "status" });
        const createdEntry = await MoodApi.logMood(data);
        moodEntryId = createdEntry.id;
        setSavedMoodId(moodEntryId);
        nextPhotoStatuses = photos.map(() => "pending");
        setPhotoStatuses(nextPhotoStatuses);
      }

      for (let index = 0; index < photos.length; index += 1) {
        if (nextPhotoStatuses[index] === "uploaded") continue;
        setFeedback({ message: `Your mood is saved. Uploading photo ${index + 1} of ${photos.length}…`, role: "status" });
        try {
          await MoodMediaApi.upload(moodEntryId, photos[index]);
          nextPhotoStatuses[index] = "uploaded";
        } catch {
          nextPhotoStatuses[index] = "failed";
        }
        setPhotoStatuses([...nextPhotoStatuses]);
      }

      const failedCount = nextPhotoStatuses.filter((status) => status === "failed").length;
      if (failedCount > 0) {
        setFeedback({
          message: `Your mood is saved, but ${failedCount} ${failedCount === 1 ? "photo needs" : "photos need"} another try. Choose “Retry failed photos” to continue.`,
          role: "alert",
        });
        return;
      }

      showToast(photos.length > 0 ? "Mood and private photos saved." : "Mood logged successfully!", "success");
      navigate("/history");
    } catch (err) {
      console.error("Failed to log mood", err);
      const response = typeof err === "object" && err !== null && "response" in err
        ? (err as { response?: { status?: number; data?: unknown } }).response
        : undefined;
      const responseData = response?.data;
      const dataMessage = typeof responseData === "object" && responseData !== null && "message" in responseData
        ? String((responseData as { message?: unknown }).message ?? "")
        : typeof responseData === "object" && responseData !== null && "title" in responseData
          ? String((responseData as { title?: unknown }).title ?? "")
          : typeof responseData === "string" ? responseData : "";
      const errorMessage = err instanceof Error ? err.message : "";
      const message = dataMessage.trim()
        || (response?.status ? `Mood logging failed (${response.status}).` : errorMessage || "Unable to reach the mood service.");
      setSaveFailed(savedMoodId === null);
      setFeedback({
        message: savedMoodId === null
          ? `Your mood could not be saved. Your check-in and selected photos are still here. ${message}`
          : `Your mood is saved, but the photo upload could not finish. ${message}`,
        role: "alert",
      });
      showToast(message, "error");
    } finally {
      submitInProgress.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", py: { xs: 0, md: 1 } }}>
      <ThemeBanner title="How are you feeling today?" description="Take a moment to notice what is present. There is no right answer." illustration="mood" />
      <Sheet variant="outlined" className="aura-panel" sx={{ p: { xs: 1.75, md: 2.5 } }}>
        <MoodEntryFormFields
          onSubmit={handleSubmit}
          disabled={savedMoodId !== null}
          isSubmitting={isSubmitting}
          submitLabel={savedMoodId !== null ? "Retry failed photos" : saveFailed ? "Try again" : "Save mood"}
          statusMessage={feedback?.message}
          statusRole={feedback?.role}
          photoStatuses={photoStatuses}
        />
      </Sheet>
    </Box>
  );
}
