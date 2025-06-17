import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import { useState } from "react";
import { MoodTypes, type MoodType } from "../features/mood/models/MoodType";
import type { MoodEntry } from "../features/mood/models/MoodEntry";
import { MoodIcons } from "../features/mood/models/MoodIcons";


interface Props {
  entry?: MoodEntry;
  onSubmit: (data: {
    date: string;
    moods: MoodType[];
    comment?: string;
  }) => void;
}

export default function MoodEntryFormFields({ entry, onSubmit }: Props) {
  const [date, setDate] = useState<Dayjs>(entry ? dayjs(entry.date) : dayjs());
  const [moods, setMoods] = useState<MoodType[]>(entry?.moods || []);
  const [comment, setComment] = useState(entry?.comment || "");

  const handleMoodChange = (mood: MoodType) => {
    setMoods((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      date: date.format("YYYY-MM-DD"),
      moods,
      comment: comment.trim() || undefined,
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} mt={2}>
      <DatePicker
        label="Date"
        value={date}
        onChange={(newDate) => newDate && setDate(newDate)}
        format="YYYY-MM-DD"
      />

      <Typography mt={2}>How are you feeling?</Typography>
      <FormGroup>
        <Box display="flex" flexWrap="wrap">
          {MoodTypes.map((mood) => (
            <Box key={mood} width="50%">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={moods.includes(mood)}
                    onChange={() => handleMoodChange(mood)}
                  />
                }
                label={`${MoodIcons[mood]} ${mood}`}
              />
            </Box>
          ))}
        </Box>
      </FormGroup>

      <TextField
        fullWidth
        multiline
        rows={3}
        label="Comment (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        margin="normal"
      />

      <Button type="submit" variant="contained" sx={{ mt: 2 }}>
        {entry ? "Update Entry" : "Submit Entry"}
      </Button>
    </Box>
  );
}
