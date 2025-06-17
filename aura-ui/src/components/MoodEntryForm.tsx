import {
  Box,
   Typography,
  Snackbar,
} from "@mui/material";
import { useState } from "react";
import { MoodApi } from "../api/MoodApi";
import type {MoodType } from "../features/mood/models/MoodType";
import MoodEntryFormFields from "./MoodEntryFormFields";

export default function MoodEntryForm() {
 const [openToast, setOpenToast] = useState(false);

  const handleSubmit = async (data: {
    date: string;
    moods: MoodType[];
    comment?: string;
  }) => {

    try {
      await MoodApi.logMood(data);
      setOpenToast(true);
    } catch (err) {
      console.error("Failed to log mood", err);
    }
  };

  return (
    <Box maxWidth={500} mx="auto" mt={4}>
      <Typography variant="h5" gutterBottom>
        Log Your Mood
      </Typography>

      <MoodEntryFormFields
        onSubmit={handleSubmit}
      />

      <Snackbar
        open={openToast}
        autoHideDuration={3000}
        onClose={() => setOpenToast(false)}
        message="Mood logged successfully!"
      />
    </Box>
  );
}
