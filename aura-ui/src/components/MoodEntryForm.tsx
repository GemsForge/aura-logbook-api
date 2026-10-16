import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import { MoodApi } from "../api/MoodApi";
import type { MoodType } from "../features/mood/models/schema/MoodType";
import MoodEntryFormFields from "./MoodEntryFormFields";
import { useToast } from "../hooks/useToast";
import { useNavigate } from "react-router-dom";

export default function MoodEntryForm() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (data: {
    date: string;
    moods: MoodType[];
    comment?: string;
  }) => {
    try {
      await MoodApi.logMood(data);
      showToast("Mood logged successfully!", "success");
      navigate("/history");
    } catch (err) {
      console.error("Failed to log mood", err);
      showToast("Error logging modd", "error");
    }
  };

  return (
    <Box sx={{ maxWidth: 500, mx: "auto", mt: 4 }}>
      <Typography level="h3" sx={{ mb: 1 }}>
        Log Your Mood
      </Typography>

      <MoodEntryFormFields onSubmit={handleSubmit} />
    </Box>
  );
}
