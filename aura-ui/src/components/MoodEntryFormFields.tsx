import Box from "@mui/joy/Box";
import Checkbox from "@mui/joy/Checkbox";
import Tooltip from "@mui/joy/Tooltip";
import Typography from "@mui/joy/Typography";
import { AuraButton as Button } from "@/components/ui/AuraButton";
import Textarea from "@mui/joy/Textarea";
import Divider from "@mui/joy/Divider";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
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

/** Stable positions keep the aura selector readable while preserving a circular interaction model. */
const auraOrbitPositions = [
  [50, 4], [78, 13], [94, 39], [86, 73], [58, 92],
  [28, 92], [6, 73], [6, 39], [22, 13],
] as const;

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
    <Box component="form" onSubmit={handleSubmit(onFormSubmit)} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography level="title-lg">Your check-in</Typography>
          <Typography level="body-sm" color="neutral" sx={{ mt: 0.5 }}>Choose one or more words that feel close.</Typography>
        </Box>
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
      </Box>
      {errors.date && (
        <Typography color="danger" level="body-sm">
          {errors.date.message}
        </Typography>
      )}

      <Divider />
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={2}>
        <Typography level="title-md">Choose what feels close</Typography>
        <Typography level="body-sm" color={selectedMoods.length > 0 ? "primary" : "neutral"}>
          {selectedMoods.length === 0 ? "Nothing selected" : `${selectedMoods.length} selected`}
        </Typography>
      </Stack>

      <Box sx={{ position: "relative", width: "100%", maxWidth: 720, minHeight: { xs: 620, sm: 540 }, mx: "auto", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,252,247,.98) 0 20%, rgba(237,229,217,.58) 20.5% 45%, rgba(255,252,247,0) 45.5%), conic-gradient(from 20deg, rgba(199,154,152,.16), rgba(135,145,123,.18), rgba(211,154,74,.16), rgba(129,95,126,.16), rgba(199,154,152,.16))", border: "1px solid rgba(217,206,192,.9)", "&::before": { content: "\"\"", position: "absolute", inset: "17%", border: "1px dashed rgba(102,93,86,.25)", borderRadius: "50%" }, "&::after": { content: "\"\"", position: "absolute", inset: "31%", border: "1px solid rgba(102,93,86,.12)", borderRadius: "50%" } }}>
        <Box sx={{ position: "absolute", inset: "32% 22%", display: "grid", placeItems: "center", textAlign: "center", pointerEvents: "none", zIndex: 2 }}>
          <Box sx={{ width: "100%", minHeight: 132, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", p: 2.5, borderRadius: "50%", backgroundColor: "rgba(255,252,247,.86)", boxShadow: "0 10px 30px rgba(78,62,51,.10)" }}>
            <Typography level="body-xs" sx={{ textTransform: "uppercase", letterSpacing: "0.16em", color: "neutral.500" }}>{selectedMoods.length ? "Your current mix" : "Your inner weather"}</Typography>
            <Typography level="title-lg" sx={{ mt: 0.5, fontFamily: "display", fontWeight: 400, lineHeight: 1.1 }}>{selectedMoods.length ? selectedMoods.slice(0, 2).join(" · ") : "Choose what feels close"}</Typography>
            {selectedMoods.length > 2 && <Typography level="body-xs" color="neutral" sx={{ mt: 0.5 }}>+ {selectedMoods.length - 2} more</Typography>}
            {!selectedMoods.length && <Typography level="body-xs" color="neutral" sx={{ mt: 0.75 }}>Select one or more colors around you.</Typography>}
          </Box>
        </Box>
        {Object.entries(auraGroups).map(([colorKey, moods], groupIndex) => {
          const color = colorKey as AuraColor;
          if (moods.length === 0) return null;

          const info = AuraColorInfo[color];
          const swatch = auraPalettes[color].primary!.main;
          const [left, top] = auraOrbitPositions[groupIndex] ?? [50, 50];
          const selectedInGroup = moods.filter((mood) => selectedMoods.includes(mood)).length;

          return (
            <Sheet key={color} variant="soft" sx={{ position: "absolute", left: `${left}%`, top: `${top}%`, transform: "translate(-50%, -50%)", width: { xs: 126, sm: 148 }, p: 1.25, borderRadius: "20px", backgroundColor: `${swatch}28`, backdropFilter: "blur(8px)", border: "2px solid", borderColor: `${swatch}B8`, boxShadow: `0 8px 24px ${swatch}30`, zIndex: 3, transition: "transform .2s ease, box-shadow .2s ease", "&:hover": { transform: "translate(-50%, -50%) scale(1.05)", boxShadow: `0 12px 30px ${swatch}5c` } }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Box
                  sx={{
                    width: 18,
                    height: 18,
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
                      mb: 0.5,
                      fontWeight: 700,
                    }}
                  >
                    {color}
                  </Typography>
                </Tooltip>
                {selectedInGroup > 0 && <Typography level="body-xs" sx={{ ml: "auto", color: swatch, fontWeight: 700 }}>{selectedInGroup}</Typography>}
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                {moods.map((mood) => {
                  const { icon, auraColor } = AuraMoodMap[mood];
                  const checked = selectedMoods.includes(mood);
                  const hue = auraPalettes[auraColor].primary!.main;
                  return (
                    <Sheet
                      key={mood}
                      variant={checked ? "solid" : "outlined"}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        borderRadius: "md",
                        borderColor: checked ? hue : "neutral.200",
                        backgroundColor: checked ? `${hue}55` : "rgba(255,252,247,.88)",
                        color: checked ? "#FFFCF7" : "neutral.800",
                        transition: "transform .18s ease, box-shadow .18s ease, background-color .18s ease",
                        "&:hover": { transform: "translateY(-1px)", boxShadow: "sm" },
                      }}
                    >
                      <Checkbox
                        checked={checked}
                        onChange={() => toggleMood(mood)}
                        label={`${icon} ${mood}`}
                        variant="plain"
                        size="lg"
                        uncheckedIcon={<Box component="span" aria-hidden="true" sx={{ width: 0, height: 0 }} />}
                        checkedIcon={<Box component="span" aria-hidden="true" sx={{ width: 0, height: 0 }} />}
                        sx={{ width: "100%", px: 0.5, color: checked ? "inherit" : hue, "& .MuiCheckbox-label": { fontWeight: checked ? 700 : 500, fontSize: "0.78rem" }, "& .MuiCheckbox-checkbox": { opacity: 0, width: 0, height: 0, minWidth: 0, minHeight: 0, p: 0, overflow: "hidden" } }}
                      />
                    </Sheet>
                  );
                })}
              </Box>
            </Sheet>
          );
        })}
        {errors.moods && (
          <Typography color="danger" level="body-sm" sx={{ mt: 1 }}>
            {errors.moods.message as string}
          </Typography>
        )}
      </Box>

      <Divider />
      <Controller
        name="comment"
        control={control}
        render={({ field }) => (
          <Box>
            <Typography level="title-md">A little more space</Typography>
            <Typography level="body-sm" color="neutral" sx={{ mb: 1 }}>What would you like to remember about this moment? <span>(optional)</span></Typography>
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

      <Button type="submit" variant="contained" sx={{ alignSelf: { xs: "stretch", sm: "flex-end" }, minWidth: 170, minHeight: 46 }}>
        {entry ? "Update Entry" : "Submit Entry"}
      </Button>
    </Box>
  );
}
