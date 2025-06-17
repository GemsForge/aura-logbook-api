import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import { useState } from "react";
import type { MoodEntry } from "../features/mood/models/MoodEntry";
import { MoodApi } from "../api/MoodApi";
import MoodEntryFormFields from "./MoodEntryFormFields";
import type { MoodType } from "../features/mood/models/MoodType";

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

  const handleSubmit = async (data: {
    date: string;
    moods: MoodType[];
    comment?: string;
  }) => {
    if (!data.moods || !data.date) {
      console.error("Moods and date are required to update.");
      return;
    }
    const payload = {
      date: data.date,
      moods: data.moods,
      comment: data.comment ?? "", // Default to empty string
    };

    setLoading(true);
    await MoodApi.updateMood(entry.id, payload);
    onSuccess();
    onClose();
  };

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Edit Mood Entry</DialogTitle>
      <DialogContent>
        <MoodEntryFormFields entry={entry} onSubmit={handleSubmit} />
      </DialogContent>
      <DialogActions>
        {/* <Button onClick={onClose} disabled={loading}>Cancel</Button> */}
        <Button disabled={loading}>
          {loading ? <CircularProgress size={16} /> : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
