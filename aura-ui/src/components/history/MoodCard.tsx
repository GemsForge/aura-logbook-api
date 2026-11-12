import type { MoodEntry } from "@/features/mood/models/schema";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Box from "@mui/joy/Box";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import Sheet from "@mui/joy/Sheet";
import IconButton from "@mui/joy/IconButton";
import dayjs from "dayjs";
import { MoodTag } from "./MoodTag";
import MarkdownReflection from "../MarkdownReflection";
import MoodMediaGallery from "./MoodMediaGallery";

/** Presents a reflection as a compact theme-surface card with its date, moods, writing, media, and entry actions. */
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
  const time = entry.createdAt ? dayjs(entry.createdAt).format("h:mm A") : null;
  return (
    <Sheet component="article" variant="outlined" sx={{ mb: 1.25, p: { xs: 1.5, sm: 2 }, position: "relative", borderColor: "var(--al-theme-border)", backgroundColor: "var(--al-theme-surface)" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography level="body-sm" color="neutral" sx={{ fontWeight: 600 }}>
          {date}{time && <Box component="span" sx={{ fontWeight: 400 }}> · {time}</Box>}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          <IconButton size="sm" onClick={() => onEdit(entry)} aria-label="Edit mood entry">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="sm" onClick={() => onDelete(entry)} aria-label="Delete mood entry">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Stack direction="row" flexWrap="wrap" mt={0.75}>
        {entry.moods.map((mood) => (
          <MoodTag key={mood} mood={mood} />
        ))}
      </Stack>

      {entry.comment && (
        <Box mt={0.5} sx={{ fontSize: "var(--joy-fontSize-md)", overflowWrap: "anywhere" }}><MarkdownReflection value={entry.comment} /></Box>
      )}

      <MoodMediaGallery moodEntryId={entry.id} />
    </Sheet>
  );
}

