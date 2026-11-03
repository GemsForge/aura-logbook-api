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
    <Sheet variant="outlined" className="aura-panel" sx={{ mb: 2.5, p: { xs: 2.5, sm: 3.5 }, position: "relative" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography level="body-sm" textColor="text.secondary">
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

      <Stack direction="row" flexWrap="wrap" mt={2}>
        {entry.moods.map((mood) => (
          <MoodTag key={mood} mood={mood} />
        ))}
      </Stack>

      {entry.comment && (
        <Box mt={1} sx={{ fontSize: "var(--joy-fontSize-md)" }}><MarkdownReflection value={entry.comment} /></Box>
      )}
    </Sheet>
  );
}

