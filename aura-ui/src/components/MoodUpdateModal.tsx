import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import { useState } from "react";
import { MoodApi } from "../api/MoodApi";
import MoodEntryFormFields from "./MoodEntryFormFields";
import type { MoodType } from "../features/mood/models/schema";
import { useToast } from "../hooks/useToast"; // 👈 Toast hook
import type { MoodEntry } from "../features/mood/models/schema";

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
    } catch (error: any) {
      const message = error?.response?.data || "Failed to update mood.";
      showToast(message, "error"); // ❌ Error toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Edit Mood Entry</DialogTitle>
      <DialogContent>
        <MoodEntryFormFields entry={entry} onSubmit={handleSubmit} />
      </DialogContent>
      <DialogActions>
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
      </DialogActions>
    </Dialog>
  );
}
