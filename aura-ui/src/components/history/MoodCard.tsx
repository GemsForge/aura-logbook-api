import type { MoodEntry } from "@/features/mood/models/schema";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { MoodTag } from "./MoodTag";

export function MoodCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: MoodEntry;
  onEdit: (entry: MoodEntry) => void;
  onDelete: (entry: MoodEntry) => void;
}) {
  const date = dayjs(entry.date).format("LL")
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" color="textSecondary">
            {date}
          </Typography>
          <Box>
            <IconButton size="small" onClick={() => onEdit(entry)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => onDelete(entry)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Stack direction="row" flexWrap="wrap" mt={1}>
          {entry.moods.map((mood) => (
            <MoodTag key={mood} mood={mood} />
          ))}
        </Stack>

        {entry.comment && (
          <Typography variant="body2" mt={1}>
            {entry.comment}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

