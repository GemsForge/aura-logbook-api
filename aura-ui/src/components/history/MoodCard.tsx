import type { MoodEntry } from "@/features/mood/models/schema";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Box from "@mui/joy/Box";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import Sheet from "@mui/joy/Sheet";
import IconButton from "@mui/joy/IconButton";
import dayjs from "dayjs";
import { Link as RouterLink } from "react-router-dom";
import { MoodTag } from "./MoodTag";
import MarkdownReflection from "../MarkdownReflection";
import MoodMediaGallery from "./MoodMediaGallery";

/** Renders one history entry with concise spacing while keeping its edit, delete, and media actions. */
export function MoodCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: MoodEntry;
  onEdit: (entry: MoodEntry) => void;
  onDelete: (entry: MoodEntry) => void;
}) {
  const date = dayjs(entry.date).format("LL");
  return (
    <Sheet variant="outlined" className="aura-panel" sx={{ mb: 1.25, p: { xs: 1.5, sm: 2 }, position: "relative" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography component={RouterLink} to={`/history/${entry.id}`} level="body-sm" textColor="text.secondary" sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline", textDecorationColor: "var(--aura-line)" }, "&:focus-visible": { outline: "2px solid var(--al-theme-focus)", outlineOffset: 2 } }}>
          {date}
        </Typography>
        <Box>
          <IconButton size="sm" onClick={() => onEdit(entry)} aria-label="Edit mood entry">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="sm" onClick={() => onDelete(entry)} aria-label="Delete mood entry">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Stack direction="row" flexWrap="wrap" mt={0.5} role="group" aria-label={`${entry.moods.length === 1 ? "Mood" : "Moods"} for this entry`}>
        {[...entry.moods].sort((left, right) => left.localeCompare(right)).map((mood) => (
          <MoodTag key={mood} mood={mood} />
        ))}
      </Stack>

      {entry.comment && (
        <Box mt={0.5} sx={{ fontSize: "var(--joy-fontSize-md)" }}><MarkdownReflection value={entry.comment} /></Box>
      )}

      <MoodMediaGallery moodEntryId={entry.id} />
    </Sheet>
  );
}

