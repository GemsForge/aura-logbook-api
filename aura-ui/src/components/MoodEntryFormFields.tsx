import Box from "@mui/joy/Box";
import Checkbox from "@mui/joy/Checkbox";
import Typography from "@mui/joy/Typography";
import { AuraButton as Button } from "@/components/ui/AuraButton";
import Divider from "@mui/joy/Divider";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { AuraColor, AuraMoodMap } from "@/features/mood/models/aura";
import { type MoodEntry, type MoodType, moodEntrySchema } from "@/features/mood/models/schema";
import { auraPalettes } from "@/theme/auraTheme";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { useGetMoodCombinationInterpretationQuery } from "@/store/auraApi";
import journalingPrompts from "../../data/aura_logbook_journaling_prompts.json";
import MDEditor from "@uiw/react-md-editor";
import MoodPhotoPicker from "@/components/MoodPhotoPicker";


type MoodEntryFormValues = {
  date: string;
  moods: MoodType[];
  comment?: string;
};

/** Stable positions keep the aura selector readable while preserving a circular interaction model. */
const auraOrbitPositions = [
  [50, 9], [77, 18], [88, 42], [81, 71], [57, 88],
  [29, 85], [12, 65], [12, 37], [27, 15],
] as const;

/** Maps the persisted pathway label to the API SpiritualPathway enum key. */
const pathwayKeyByUserPathway: Record<string, number> = {
  Mindfulness: 0,
  Energy: 1,
  Faith: 2,
};

type JournalingPrompt = { id: string; question: string };
type JournalingPromptPathway = { id: string; prompts: JournalingPrompt[] };

/** Maps the persisted user pathway to the prompt-library pathway identifier. */
const promptPathwayByUserPathway: Record<string, string> = {
  Mindfulness: "mindful",
  Energy: "astrology-energy",
  Faith: "faith-religion",
};


interface Props {
  entry?: MoodEntry;
  showSubmitButton?: boolean;
  /** Reports normalized mood data and prepared photos without putting image bytes in the mood request. */
  onSubmit: (data: {
    date: string;
    moods: MoodType[];
    comment?: string;
  }, photos: File[]) => void | Promise<void>;
  /** Locks entry fields after mood creation to prevent photo retries from creating another entry. */
  disabled?: boolean;
  /** Disables submit while the mood or its photos are being saved. */
  isSubmitting?: boolean;
  /** Replaces the normal button label during a failed-photo retry. */
  submitLabel?: string;
  /** Progress or recovery copy announced to assistive technology. */
  statusMessage?: string;
  /** Uses an alert for failures and a polite status for progress. */
  statusRole?: "alert" | "status";
  /** Per-photo upload state displayed beside its preview. */
  photoStatuses?: Array<"pending" | "uploaded" | "failed">;
}

export default function MoodEntryFormFields({ entry, showSubmitButton = true, onSubmit, disabled = false, isSubmitting = false, submitLabel, statusMessage, statusRole = "status", photoStatuses = [] }: Props) {
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const location = useLocation();
  const preselectedMood = (location.state as { preselectedMood?: MoodType } | null)?.preselectedMood;
  const currentUser = useAppSelector(selectCurrentUser);
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MoodEntryFormValues>({
    resolver: yupResolver(moodEntrySchema) as Resolver<MoodEntryFormValues>,
    defaultValues: {
      date: entry
        ? dayjs(entry.date).format("YYYY-MM-DD")
        : dayjs().format("YYYY-MM-DD"),
      moods: entry?.moods ?? (preselectedMood ? [preselectedMood] : []),
      comment: entry?.comment ?? "",
    },
  });

  // Rehydrate the editor whenever a different history entry is opened in the modal.
  useEffect(() => {
    if (!entry) return;
    reset({
      date: dayjs(entry.date).format("YYYY-MM-DD"),
      moods: entry.moods ?? [],
      comment: entry.comment ?? "",
    });
  }, [entry, reset]);

  const selectedMoods = watch("moods");
  const pathwayKey = pathwayKeyByUserPathway[currentUser?.selectedPathway ?? "Mindfulness"] ?? 0;
  const interpretationEligible = selectedMoods.length >= 2 && selectedMoods.length <= 3;
  const {
    currentData: interpretation,
    isError: interpretationError,
    isFetching: interpretationLoading,
    isSuccess: interpretationLoaded,
    refetch: refetchInterpretation,
  } = useGetMoodCombinationInterpretationQuery(
    { moods: selectedMoods, pathwayKey },
    { skip: !currentUser || !interpretationEligible },
  );
  const promptPathwayId = promptPathwayByUserPathway[currentUser?.selectedPathway ?? "Mindfulness"] ?? "mindful";
  const promptPathway = (journalingPrompts.pathways as JournalingPromptPathway[]).find(({ id }) => id === promptPathwayId);
  const promptIndex = (dayjs().month() + dayjs().date()) % (promptPathway?.prompts.length || 1);
  const reflectionPrompt = promptPathway?.prompts[promptIndex]?.question ?? "What would you like to remember about this moment?";

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
    void onSubmit({
      date: dayjs(data.date).format("YYYY-MM-DD"),
      moods: data.moods,
      comment: data.comment?.trim() || undefined,
    }, selectedPhotos);
  };

  return (
    <Box id="mood-form" component="form" onSubmit={handleSubmit(onFormSubmit)} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
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
              disabled={disabled || isSubmitting}
              value={dayjs(field.value)}
              onChange={(newDate) => newDate && field.onChange(newDate.format("YYYY-MM-DD"))}
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
      <Typography level="body-xs" color="neutral">Color meanings are optional personal reflection, not a health assessment.</Typography>

      <Box sx={{ position: "relative", width: "100%", maxWidth: 720, display: { xs: "grid", sm: "block" }, gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.5, p: { xs: 1.5, sm: 0 }, minHeight: { xs: "auto", sm: 660 }, mx: "auto", borderRadius: { xs: "24px", sm: "50%" }, background: "radial-gradient(circle, var(--al-theme-surface) 0 20%, color-mix(in srgb, var(--al-theme-surface-raised) 72%, transparent) 20.5% 45%, transparent 45.5%), conic-gradient(from 20deg, color-mix(in srgb, var(--aura-accent) 24%, transparent), color-mix(in srgb, var(--al-theme-accent) 24%, transparent), color-mix(in srgb, var(--aura-accent) 10%, transparent), color-mix(in srgb, var(--al-theme-primary) 18%, transparent), color-mix(in srgb, var(--aura-accent) 24%, transparent))", border: "1px solid var(--al-theme-border)", "&::before": { content: "\"\"", position: "absolute", inset: "17%", border: "1px dashed color-mix(in srgb, var(--al-theme-ink-muted) 40%, transparent)", borderRadius: "50%" }, "&::after": { content: "\"\"", position: "absolute", inset: "31%", border: "1px solid color-mix(in srgb, var(--al-theme-ink-muted) 22%, transparent)", borderRadius: "50%" } }}>
        <Box sx={{ position: "absolute", inset: "32% 22%", display: { xs: "none", sm: "grid" }, placeItems: "center", textAlign: "center", pointerEvents: "none", zIndex: 2 }}>
          <Box sx={{ width: "100%", minHeight: 132, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", p: 2.5, borderRadius: "50%", backgroundColor: "var(--al-theme-surface)", boxShadow: "0 10px 30px var(--al-theme-glow)" }}>
            <Typography level="body-xs" sx={{ textTransform: "uppercase", letterSpacing: "0.16em", color: "neutral.500" }}>{selectedMoods.length ? "Your current mix" : "Your inner weather"}</Typography>
            <Typography level="title-lg" sx={{ mt: 0.5, fontFamily: "display", fontWeight: 400, lineHeight: 1.1 }}>{selectedMoods.length ? selectedMoods.slice(0, 2).join(" · ") : "Choose what feels close"}</Typography>
            {selectedMoods.length > 2 && <Typography level="body-xs" color="neutral" sx={{ mt: 0.5 }}>+ {selectedMoods.length - 2} more</Typography>}
            {!selectedMoods.length && <Typography level="body-xs" color="neutral" sx={{ mt: 0.75 }}>Select one or more colors around you.</Typography>}
          </Box>
        </Box>
        {Object.entries(auraGroups).map(([colorKey, moods], groupIndex) => {
          const color = colorKey as AuraColor;
          if (moods.length === 0) return null;

          const swatch = auraPalettes[color].primary!.main;
          const [left, top] = auraOrbitPositions[groupIndex] ?? [50, 50];
          const selectedInGroup = moods.filter((mood) => selectedMoods.includes(mood)).length;

          return (
            <Sheet key={color} variant="soft" sx={{ position: { xs: "relative", sm: "absolute" }, left: { xs: "auto", sm: `${left}%` }, top: { xs: "auto", sm: `${top}%` }, transform: { xs: "none", sm: "translate(-50%, -50%)" }, width: { xs: "auto", sm: 140 }, p: 1.25, borderRadius: "20px", backgroundColor: `${swatch}28`, backdropFilter: "blur(8px)", border: "2px solid", borderColor: `${swatch}B8`, boxShadow: `0 8px 24px ${swatch}30`, zIndex: 3, transition: "transform .2s ease, box-shadow .2s ease", "&:hover": { transform: { xs: "translateY(-2px)", sm: "translate(-50%, -50%) scale(1.03)" }, boxShadow: `0 12px 30px ${swatch}5c` } }}>
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
                <Typography level="title-sm" sx={{ color: "neutral.800", textTransform: "capitalize", mb: 0.5, fontWeight: 700 }}>
                  {color}
                </Typography>
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
                        backgroundColor: checked ? `${hue}55` : "var(--al-theme-surface)",
                        color: "neutral.900",
                        transition: "transform .18s ease, box-shadow .18s ease, background-color .18s ease",
                        "&:hover": { transform: "translateY(-1px)", boxShadow: "sm" },
                      }}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={disabled || isSubmitting}
                        onChange={() => toggleMood(mood)}
                        label={`${icon} ${mood}`}
                        variant="plain"
                        size="lg"
                        uncheckedIcon={<Box component="span" aria-hidden="true" sx={{ width: 0, height: 0 }} />}
                        checkedIcon={<Box component="span" aria-hidden="true" sx={{ width: 0, height: 0 }} />}
                        sx={{ width: "100%", px: 0.5, color: "neutral.900", "& .MuiCheckbox-label": { fontWeight: checked ? 700 : 500, fontSize: "0.78rem", lineHeight: 1.3, py: 0.5 }, "& .MuiCheckbox-checkbox": { opacity: 0, width: 0, height: 0, minWidth: 0, minHeight: 0, p: 0, overflow: "hidden" } }}
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

      {!entry && <MoodPhotoPicker onChange={setSelectedPhotos} disabled={disabled || isSubmitting} statuses={photoStatuses} />}

      {statusMessage && <Typography role={statusRole} aria-live={statusRole === "alert" ? "assertive" : "polite"} aria-atomic="true" level="body-sm" color={statusRole === "alert" ? "danger" : "primary"}>{statusMessage}</Typography>}

      {interpretationEligible && currentUser && (
        <Sheet variant="soft" sx={{ p: { xs: 1.75, sm: 2.25 }, borderRadius: "lg", border: "1px solid", borderColor: "primary.outlinedBorder" }}>
          <Typography level="body-xs" sx={{ textTransform: "uppercase", letterSpacing: "0.14em", color: "primary.700", fontWeight: 700 }}>
            Your pathway reflection
          </Typography>
          {interpretationLoading && <Typography role="status" level="body-sm" sx={{ mt: 0.75 }}>Finding a reflection for this mood mix…</Typography>}
          {interpretationError && (
            <Typography role="alert" level="body-sm" color="danger" sx={{ mt: 0.75 }}>
              This reflection couldn’t load. <Button variant="plain" onClick={() => refetchInterpretation()}>Try again</Button>
            </Typography>
          )}
          {!interpretationLoading && !interpretationError && interpretation && (
            <Typography level="body-md" sx={{ mt: 0.75, whiteSpace: "pre-wrap" }}>{interpretation.interpretation}</Typography>
          )}
          {interpretationLoaded && !interpretationLoading && !interpretation && !interpretationError && (
            <Typography level="body-sm" color="neutral" sx={{ mt: 0.75 }}>There isn’t a reflection for this combination yet.</Typography>
          )}
        </Sheet>
      )}

      <Divider />
      <Controller
        name="comment"
        control={control}
        render={({ field }) => (
          <Box>
            <Typography level="h3" sx={{ fontSize: "1.8rem", fontWeight: 400 }}>A little more space</Typography>
            <Typography level="body-sm" color="neutral" sx={{ mb: 1 }}>{reflectionPrompt} <span>(optional)</span></Typography>
            {/* Markdown remains the persisted comment value, so the editor does not introduce an HTML-only format. */}
            <Box data-color-mode="light" sx={{ "& .w-md-editor": { borderRadius: "14px", borderColor: errors.comment ? "var(--joy-palette-danger-500)" : "var(--al-theme-border)", backgroundColor: "var(--al-theme-surface)", color: "var(--al-theme-ink)", boxShadow: "none", overflow: "hidden" }, "& .w-md-editor-toolbar": { backgroundColor: "var(--al-theme-surface-raised)", borderBottomColor: "var(--al-theme-border)" }, "& .w-md-editor-content": { backgroundColor: "transparent" }, "& .w-md-editor-text-pre, & .w-md-editor-text-input, & .w-md-editor-text": { fontFamily: "inherit", fontSize: "0.98rem", lineHeight: 1.6, color: "var(--al-theme-ink)" }, "& .w-md-editor-text-input": { padding: "16px" }, "& .w-md-editor-preview": { padding: "16px", fontFamily: "inherit" } }}>
              <MDEditor
                value={field.value ?? ""}
                onChange={(value) => field.onChange(value ?? "")}
                preview={disabled ? "preview" : "edit"}
                hideToolbar={disabled}
                textareaProps={{ "aria-label": "Reflection", placeholder: "Write what you noticed, felt, or want to remember…", readOnly: disabled || isSubmitting }}
                height={180}
              />
            </Box>
            {errors.comment && (
              <Typography color="danger" level="body-sm">
                {errors.comment.message}
              </Typography>
            )}
          </Box>
        )}
      />

      {showSubmitButton && (
        <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ alignSelf: { xs: "stretch", sm: "flex-end" }, minWidth: 170, minHeight: 46 }}>
          {submitLabel ?? (entry ? "Update Entry" : "Submit Entry")}
        </Button>
      )}
    </Box>
  );
}
