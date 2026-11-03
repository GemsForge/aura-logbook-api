import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Sheet from "@mui/joy/Sheet";
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
    <Box sx={{ maxWidth: 900, mx: "auto", py: { xs: 2, md: 5 } }}>
      <Typography level="body-xs" sx={{ textTransform: "uppercase", letterSpacing: "0.18em", color: "neutral.500" }}>
        Daily check-in
      </Typography>
      <Typography level="h1" sx={{ mt: 1, fontSize: { xs: "2.5rem", md: "3.5rem" }, letterSpacing: "-0.05em" }}>
        How are you feeling today? · Log Your Mood
      </Typography>
      <Typography level="body-lg" color="neutral" sx={{ maxWidth: 560, mt: 1 }}>
        Take a moment to notice what is present. There is no right answer.
      </Typography>
      <Sheet variant="outlined" sx={{ mt: 4, p: { xs: 2, md: 4 }, borderRadius: "lg", backgroundColor: "background.surface", boxShadow: "sm" }}>
        <MoodEntryFormFields onSubmit={handleSubmit} />
      </Sheet>
    </Box>
  );
}
