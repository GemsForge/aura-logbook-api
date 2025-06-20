import { Chip } from "@mui/material";
import { MoodIcons } from "../../features/mood/models/aura/MoodIcons";

export function MoodTag({ mood }: { mood: string }) {
  return (
    <Chip
      label={`${MoodIcons[mood as keyof typeof MoodIcons] ?? ""} ${mood}`}
      variant="outlined"
      sx={{ mr: 1, mb: 1 }}
    />
  );
}
