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
import dayjs from "dayjs";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { MoodIcons } from "../features/mood/models/MoodIcons";
import { MoodTypes, type MoodType } from "../features/mood/models/MoodType";
import type { MoodEntry } from "../features/mood/models/MoodEntry";
import { moodEntrySchema } from "../features/mood/models/MoodSchema";

interface Props {
  entry?: MoodEntry;
  onSubmit: (data: {
    date: string;
    moods: MoodType[];
    comment?: string;
  }) => void;
}

export default function MoodEntryFormFields({ entry, onSubmit }: Props) {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(moodEntrySchema),
    defaultValues: {
      date: entry ? dayjs(entry.date).format("MM-DD-YYYY") : dayjs().format("MM-DD-YYYY"),
      moods: entry?.moods ?? [],
      comment: entry?.comment ?? "",
    },
  });

  const selectedMoods = watch("moods");

  const toggleMood = (mood: MoodType) => {
    const updated = selectedMoods.includes(mood)
      ? selectedMoods.filter((m) => m !== mood)
      : [...selectedMoods, mood];
    setValue("moods", updated);
  };

  const onFormSubmit = (data: any) => {
    onSubmit({
      date: dayjs(data.date).format("YYYY-MM-DD"),
      moods: data.moods,
      comment: data.comment?.trim() || undefined,
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onFormSubmit)} mt={2}>
      <Controller
        name="date"
        control={control}
        render={({ field }) => (
          <DatePicker
            label="Date"
            value={dayjs(field.value)}
            onChange={(newDate) => newDate && field.onChange(newDate)}
            format="MM-DD-YYYY"
          />
        )}
      />
      {errors.date && (
        <Typography color="error" variant="body2">
          {errors.date.message}
        </Typography>
      )}

      <Typography mt={2}>How are you feeling?</Typography>
      <FormGroup>
        <Box display="flex" flexWrap="wrap">
          {MoodTypes.map((mood) => (
            <Box key={mood} width="50%">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedMoods.includes(mood)}
                    onChange={() => toggleMood(mood)}
                  />
                }
                label={`${MoodIcons[mood]} ${mood}`}
              />
            </Box>
          ))}
        </Box>
        {errors.moods && (
          <Typography color="error" variant="body2" mt={1}>
            {errors.moods.message as string}
          </Typography>
        )}
      </FormGroup>

      <Controller
        name="comment"
        control={control}
        render={({ field }) => (
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Comment (optional)"
            margin="normal"
            {...field}
          />
        )}
      />

      <Button type="submit" variant="contained" sx={{ mt: 2 }}>
        {entry ? "Update Entry" : "Submit Entry"}
      </Button>
    </Box>
  );
}
