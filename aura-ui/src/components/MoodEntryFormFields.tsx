import Box from "@mui/joy/Box";
import Checkbox from "@mui/joy/Checkbox";
import Tooltip from "@mui/joy/Tooltip";
import Typography from "@mui/joy/Typography";
import { AuraButton as Button } from "@/components/ui/AuraButton";
import Textarea from "@mui/joy/Textarea";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { AuraColor, AuraColorInfo, AuraMoodMap } from "@/features/mood/models/aura";
import { type MoodEntry, type MoodType, moodEntrySchema } from "@/features/mood/models/schema";
import { auraPalettes } from "@/theme/auraTheme";


type MoodEntryFormValues = {
  date: string;
  moods: MoodType[];
  comment?: string;
};

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
  } = useForm<MoodEntryFormValues>({
    resolver: yupResolver(moodEntrySchema) as Resolver<MoodEntryFormValues>,
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

  const onFormSubmit = (data: MoodEntryFormValues) => {
    onSubmit({
      date: dayjs(data.date).format("YYYY-MM-DD"),
      moods: data.moods,
      comment: data.comment?.trim() || undefined,
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onFormSubmit)} sx={{ mt: 2 }}>
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
        <Typography color="danger" level="body-sm">
          {errors.date.message}
        </Typography>
      )}

      <Typography level="title-md" sx={{ mt: 2, mb: 1 }}>
        How are you feeling?
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
          gap: 2,
        }}
      >
        {Object.entries(auraGroups).map(([colorKey, moods]) => {
          const color = colorKey as AuraColor;
          if (moods.length === 0) return null;

          const info = AuraColorInfo[color];
          const swatch = auraPalettes[color].primary!.main;

          return (
            <Box key={color}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
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
                      <Typography level="title-sm">{info.name}</Typography>
                      <Typography level="body-sm">{info.meaning}</Typography>
                    </Box>
                  }
                  arrow
                >
                  <Typography
                    level="title-sm"
                    sx={{
                      color: auraPalettes[color].primary!.main,
                      textTransform: "capitalize",
                      mb: 1,
                    }}
                  >
                    {color}
                  </Typography>
                </Tooltip>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap" }}>
                {moods.map((mood) => {
                  const { icon, auraColor } = AuraMoodMap[mood];
                  const checked = selectedMoods.includes(mood);
                  const hue = auraPalettes[auraColor].primary!.main;
                  return (
                    <Box key={mood} sx={{ width: "50%" }}>
                      <Checkbox
                        checked={checked}
                        onChange={() => toggleMood(mood)}
                        label={`${icon} ${mood}`}
                        variant="plain"
                        sx={{ color: hue }}
                      />
                    </Box>
                  );
                })}
              </Box>
            </Box>
          );
        })}
        {errors.moods && (
          <Typography color="danger" level="body-sm" sx={{ mt: 1 }}>
            {errors.moods.message as string}
          </Typography>
        )}
      </Box>

      <Controller
        name="comment"
        control={control}
        render={({ field }) => (
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography level="title-sm">Comment (optional)</Typography>
            <Textarea
              {...field}
              minRows={3}
              error={!!errors.comment}
              sx={{ width: "100%", fontFamily: "inherit" }}
            />
            {errors.comment && (
              <Typography color="danger" level="body-sm">
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
