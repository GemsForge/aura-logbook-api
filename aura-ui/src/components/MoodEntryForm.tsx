import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  TextField,
  Typography,
  Snackbar,
} from "@mui/material";
import { useState } from "react";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import { MoodApi } from "../api/MoodApi";
import { MoodTypes, type MoodType } from "../features/mood/models/MoodType";


const ALL_MOODS =MoodTypes;

export default function MoodEntryForm() {
  const [date, setDate] = useState<Dayjs>(dayjs());
  const [moods, setMoods] = useState<MoodType[]>([]);
  const [comment, setComment] = useState("");
  const [openToast, setOpenToast] = useState(false);

  const handleMoodChange = (mood: MoodType) => {
    setMoods((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await MoodApi.logMood({
        date: date.format("YYYY-MM-DD"),
        moods,
        comment: comment.trim() || undefined,
      });
      setOpenToast(true);
      setMoods([]);
      setComment("");
    } catch (err) {
      console.error("Failed to log mood", err);
    }
  };

  return (
    <Box maxWidth={500} mx="auto" mt={4}>
      <Typography variant="h5" gutterBottom>
        Log Your Mood
      </Typography>

      <form onSubmit={handleSubmit}>
        <DatePicker
          label="Date"
          value={date}
          onChange={(newDate) => newDate && setDate(newDate)}
          format="YYYY-MM-DD"
        />

        <Typography mt={2}>How are you feeling?</Typography>
        <FormGroup>
          {ALL_MOODS.map((mood: MoodType) => (
            <FormControlLabel
              key={mood}
              control={
                <Checkbox
                  checked={moods.includes(mood)}
                  onChange={() => handleMoodChange(mood)}
                />
              }
              label={mood}
            />
          ))}
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
          Submit Entry
        </Button>
      </form>

      <Snackbar
        open={openToast}
        autoHideDuration={3000}
        onClose={() => setOpenToast(false)}
        message="Mood logged successfully!"
      />
    </Box>
  );
}
