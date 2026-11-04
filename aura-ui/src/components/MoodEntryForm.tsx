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
        || (response?.status ? `Mood logging failed (${response.status}).` : "Unable to reach the mood service.")
        || errorMessage;
      showToast(message, "error");
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", py: { xs: 1, md: 2 } }}>
      <Typography className="aura-eyebrow" level="body-xs" sx={{ color: "neutral.500" }}>
        Daily check-in
      </Typography>
      <Typography level="h1" className="aura-page-heading" sx={{ mt: 1.5, maxWidth: 700 }}>
        How are you feeling today?
      </Typography>
      <Typography level="body-lg" color="neutral" sx={{ maxWidth: 560, mt: 1 }}>
        Take a moment to notice what is present. There is no right answer.
      </Typography>
      <Sheet variant="outlined" className="aura-panel" sx={{ mt: 4, p: { xs: 2.5, md: 4 } }}>
        <MoodEntryFormFields onSubmit={handleSubmit} />
      </Sheet>
      <Typography level="body-sm" color="neutral" sx={{ mt: 2 }}>
        To add a photo, save your mood first, then choose Add photo on its History card.
      </Typography>
    </Box>
  );
}
