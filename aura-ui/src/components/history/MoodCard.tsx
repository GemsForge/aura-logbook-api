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
import { MoodTag } from "./MoodTag";
import type { MoodEntry } from "../../features/mood/models/MoodEntry";

export function MoodCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: MoodEntry;
  onEdit: (entry: MoodEntry) => void;
  onDelete: (entry: MoodEntry) => void;
}) {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" color="textSecondary">
            {entry.date}
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
