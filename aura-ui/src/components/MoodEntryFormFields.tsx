import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { AuraColor, AuraMoodMap } from "@/features/mood/models/aura";
import { type MoodEntry, type MoodType, moodEntrySchema, MoodTypes } from "@/features/mood/models/schema";
import { auraPalettes } from "@/theme/auraTheme";


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
      date: entry
        ? dayjs(entry.date).format("MM-DD-YYYY")
        : dayjs().format("MM-DD-YYYY"),
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

  // Group moods by auraColor
  const auraGroups: Record<AuraColor, MoodType[]> = Object.values(
    AuraColor
  ).reduce((acc, color) => {
    acc[color] = MoodTypes.filter((m) => AuraMoodMap[m].auraColor === color);
    return acc;
  }, {} as Record<AuraColor, MoodType[]>);
  
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

      <Typography mt={2} mb={1} variant="subtitle1">
        How are you feeling?
      </Typography>

      <FormGroup>
        {Object.entries(auraGroups).map(([colorKey, moods]) => {
          const color = colorKey as AuraColor;
          if (moods.length === 0) return null;
          return (
            <Box key={color} mb={2}>
              <Typography
                variant="subtitle2"
                sx={{
                  color: auraPalettes[color].primary!.main,
                  textTransform: "capitalize",
                  mb: 1,
                }}>
                {color}
              </Typography>
              <Box display="flex" flexWrap="wrap">
                {moods.map((mood) => {
                  const { icon, auraColor } = AuraMoodMap[mood];
                  const checked = selectedMoods.includes(mood);
                  const hue = auraPalettes[auraColor].primary!.main;
                  return (
                    <Box key={mood} width="50%">
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={checked}
                            onChange={() => toggleMood(mood)}
                            sx={{
                              color: hue,
                              "&.Mui-checked": { color: hue },
                            }}
                          />
                        }
                        label={
                          <span style={{ color: hue }}>
                            {icon} {mood}
                          </span>
                        }
                      />
                    </Box>
                  );
                })}
              </Box>
            </Box>
          );
        })}
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
          <Box mt={2} mb={2}>
            <Typography variant="subtitle2">Comment (optional)</Typography>
            <Box
              component="textarea"
              {...field}
              style={{
                width: "100%",
                minHeight: 80,
                padding: 8,
                fontFamily: "inherit",
                fontSize: "1rem",
                borderColor: errors.comment ? "red" : "#ccc",
              }}
            />
            {errors.comment && (
              <Typography color="error" variant="body2">
                {errors.comment.message}
              </Typography>
            )}
          </Box>
        )}
      />

      <Button type="submit" variant="contained" sx={{ mt: 2 }}>
        {entry ? "Update Entry" : "Submit Entry"}
      </Button>
    </Box>
  );
}
