import { Card, CardContent, Typography, Stack } from "@mui/material";
import type { MoodEntry } from "../features/mood/models/MoodEntry";
import { MoodTag } from "./MoodTag";
import dayjs from "dayjs";

export function MoodCard({ entry }: { entry: MoodEntry }) {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="subtitle2" color="textSecondary">
          {dayjs(entry.date).format("MMMM D, YYYY")}
        </Typography>

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
