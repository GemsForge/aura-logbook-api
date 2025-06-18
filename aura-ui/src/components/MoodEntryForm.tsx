import { Box, Typography } from "@mui/material";
import { MoodApi } from "../api/MoodApi";
import type { MoodType } from "../features/mood/models/MoodType";
import MoodEntryFormFields from "./MoodEntryFormFields";
import { useToast } from "../hooks/useToast";

export default function MoodEntryForm() {
  const { showToast } = useToast();
  const handleSubmit = async (data: {
    date: string;
    moods: MoodType[];
    comment?: string;
  }) => {
    try {
      await MoodApi.logMood(data);
      showToast("Mood logged successfully!", "success");
    } catch (err) {
      console.error("Failed to log mood", err);
      showToast("Error logging modd", "error");
    }
  };

  return (
    <Box maxWidth={500} mx="auto" mt={4}>
      <Typography variant="h5" gutterBottom>
        Log Your Mood
      </Typography>

      <MoodEntryFormFields onSubmit={handleSubmit} />
    </Box>
  );
}
