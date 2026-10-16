import {
  CircularProgress,
} from "@mui/material";
import { AuraButton as Button } from "@/components/ui/AuraButton";
import { useState } from "react";
import { MoodApi } from "../api/MoodApi";
import MoodEntryFormFields from "./MoodEntryFormFields";
import type { MoodType } from "../features/mood/models/schema";
import { useToast } from "../hooks/useToast"; // 👈 Toast hook
import type { MoodEntry } from "../features/mood/models/schema";
import { AuraModal } from "./ui/AuraModal";

export default function MoodUpdateModal({
  entry,
  onClose,
  onSuccess,
}: {
  entry: MoodEntry;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast(); // 👈 Init toast

  const handleSubmit = async (data: {
    date: string;
    moods: MoodType[];
    comment?: string;
  }) => {
    if (!data.moods || !data.date) {
      console.error("Moods and date are required to update.");
      showToast("Mood and date are required.", "warning");
      return;
    }

    const payload = {
      date: data.date,
      moods: data.moods,
      comment: data.comment ?? "",
    };

    setLoading(true);
    try {
      await MoodApi.updateMood(entry.id, payload);
      showToast("Mood updated successfully!", "success"); // ✅ Success toast
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const response = typeof error === "object" && error !== null && "response" in error
        ? (error as { response?: { data?: unknown } }).response
        : undefined;
      const message = typeof response?.data === "string" ? response.data : "Failed to update mood.";
      showToast(message, "error"); // ❌ Error toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuraModal
      open
      onClose={onClose}
      title="Edit Mood Entry"
      actions={
        <>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={() => {}}
            disabled={loading}
            type="submit"
            form="mood-form">
            {loading ? <CircularProgress size={16} /> : "Update"}
          </Button>
        </>
      }>
        <MoodEntryFormFields entry={entry} onSubmit={handleSubmit} />
    </AuraModal>
  );
}
