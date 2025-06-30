import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  Tooltip,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { AuraColor, AuraColorInfo, AuraMoodMap } from "@/features/mood/models/aura";
import { type MoodEntry, type MoodType, moodEntrySchema } from "@/features/mood/models/schema";
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

  // group moods by auraColor
  const auraGroups = Object.values(AuraColor).reduce((acc, color) => {
    acc[color] = [];
    return acc;
  }, {} as Record<AuraColor, MoodType[]>);
  (Object.keys(AuraMoodMap) as MoodType[]).forEach((m) => {
    auraGroups[AuraMoodMap[m].auraColor].push(m);
  });

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

      <Grid container spacing={2}>
        {Object.entries(auraGroups).map(([colorKey, moods]) => {
          const color = colorKey as AuraColor;
          if (moods.length === 0) return null;

          const info = AuraColorInfo[color];
           const swatch = auraPalettes[color].primary!.main;
          
          return (
            <Grid key={color} sx={{xs:12, sm:4}}>
        <Box display="flex" alignItems="center" mb={1}>
          <Box
            sx={{
              width: 12,
              height: 12,
              bgcolor: swatch,
              borderRadius: "50%",
              mr: 1,
            }}
          />
            <Tooltip
             title={
               <Box>
                 <Typography variant="subtitle2">{info.name}</Typography>
                 <Typography variant="body2">{info.meaning}</Typography>
               </Box>
             }
             arrow
           >
              <Typography
                variant="subtitle2"
                sx={{
                  color: auraPalettes[color].primary!.main,
                  textTransform: "capitalize",
                  mb: 1,
                }}>
                {color}
              </Typography>
              </Tooltip>
              </Box>
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
            </Grid>
          );
        })}
        {errors.moods && (
          <Typography color="error" variant="body2" mt={1}>
            {errors.moods.message as string}
          </Typography>
        )}
      </Grid>

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
