import { Chip } from "@mui/material";

export function MoodTag({ mood }: { mood: string }) {
  return <Chip label={mood} variant="outlined" sx={{ mr: 1, mb: 1 }} />;
}
