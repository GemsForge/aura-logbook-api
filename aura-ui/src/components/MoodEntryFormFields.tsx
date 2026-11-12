import Box from "@mui/joy/Box";
import Checkbox from "@mui/joy/Checkbox";
import Typography from "@mui/joy/Typography";
import { AuraButton as Button } from "@/components/ui/AuraButton";
import ShuffleRounded from "@mui/icons-material/ShuffleRounded";
import AddPhotoAlternateOutlined from "@mui/icons-material/AddPhotoAlternateOutlined";
import IconButton from "@mui/joy/IconButton";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { type MoodEntry, type MoodType, moodEntrySchema } from "@/features/mood/models/schema";
import { MoodIcon } from "@/components/mood/MoodIcon";
import { useGetReferenceDataQuery } from "@/store/referenceDataApi";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { normalizeSpiritualPathway, type SpiritualPathway } from "@/features/auth/models/SpiritualPathway";
import { useGetMoodCombinationInterpretationQuery } from "@/store/auraApi";
import journalingPrompts from "../../data/aura_logbook_journaling_prompts.json";
import MDEditor from "@uiw/react-md-editor";
import MoodPhotoPicker from "@/components/MoodPhotoPicker";
import { getCheckInSubtext } from "@/features/mood/checkInCopy";
import { getMoodPillSx } from "@/components/mood/moodPillStyles";


type MoodEntryFormValues = {
  date: string;
  moods: MoodType[];
  comment?: string;
};

/** Maps the persisted pathway label to the API SpiritualPathway enum key. */
const pathwayKeyByUserPathway: Record<SpiritualPathway, number> = {
  mindfulness: 0,
  energy: 1,
  faith: 2,
};

type JournalingPrompt = { id: string; question: string };
type JournalingPromptPathway = { id: string; title: string; prompts: JournalingPrompt[] };

/** Maps the persisted user pathway to the prompt-library pathway identifier. */
const promptPathwayByUserPathway: Record<SpiritualPathway, string> = {
  mindfulness: "mindful",
  energy: "astrology-energy",
  faith: "faith-religion",
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
  // Notes remain optional, while photo attachments are opened only when requested.
  const [photosOpen, setPhotosOpen] = useState(false);
  const [promptSelection, setPromptSelection] = useState<{ pathwayId: string; promptId: string } | null>(null);
  const location = useLocation();
  const preselectedMood = (location.state as { preselectedMood?: MoodType } | null)?.preselectedMood;
  const currentUser = useAppSelector(selectCurrentUser);
  const { data: referenceData } = useGetReferenceDataQuery();
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
  const showPhotos = photosOpen || Boolean(entry) || selectedPhotos.length > 0;
  // Labels and enum keys resolve the same way as on Today and in the banner art.
  const userPathway = normalizeSpiritualPathway(currentUser?.selectedPathway) ?? "mindfulness";
  const pathwayKey = pathwayKeyByUserPathway[userPathway];
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
  const promptPathwayId = promptPathwayByUserPathway[userPathway];
  const promptPathway = (journalingPrompts.pathways as JournalingPromptPathway[]).find(({ id }) => id === promptPathwayId);
  const promptIndex = (dayjs().month() + dayjs().date()) % (promptPathway?.prompts.length || 1);
  const dailyPrompt = promptPathway?.prompts[promptIndex];
  const selectedPromptId = promptSelection?.pathwayId === promptPathwayId ? promptSelection.promptId : null;
  const activePrompt = promptPathway?.prompts.find(({ id }) => id === selectedPromptId) ?? dailyPrompt;
  const reflectionPrompt = activePrompt?.question ?? "What would you like to remember about this moment?";

  /** Chooses another prompt from the selected pathway without repeating the visible prompt. */
  const chooseAnotherPrompt = () => {
    const alternatives = promptPathway?.prompts.filter(({ id }) => id !== activePrompt?.id) ?? [];
    if (alternatives.length === 0) return;
    setPromptSelection({ pathwayId: promptPathwayId, promptId: alternatives[Math.floor(Math.random() * alternatives.length)].id });
  };

  const toggleMood = (mood: MoodType) => {
    const updated = selectedMoods.includes(mood)
      ? selectedMoods.filter((m) => m !== mood)
      : [...selectedMoods, mood];
    setValue("moods", updated);
  };

  // Keep the selector as one compact row so the written reflection stays visually primary.
  const moodDefinitions = [...(referenceData?.moods ?? [])].sort((left, right) => left.displayName.localeCompare(right.displayName));

  const onFormSubmit = (data: MoodEntryFormValues) => {
    void onSubmit({
      // New entries always use today's local date; edits keep the date selected for that entry.
      date: dayjs(entry ? data.date : undefined).format("YYYY-MM-DD"),
      moods: data.moods,
      comment: data.comment?.trim() || undefined,
    }, selectedPhotos);
  };

  return (
    <Box id="mood-form" component="form" onSubmit={handleSubmit(onFormSubmit)} sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
      {/* Keep the prompt readable while letting a light aura wash connect it to the day's reflection. */}
      <Sheet variant="soft" sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, p: { xs: 1, sm: 1.25 }, borderRadius: "lg", backgroundColor: "color-mix(in srgb, var(--aura-accent) 12%, var(--al-theme-surface-raised))", borderInlineStart: "3px solid var(--aura-accent)" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography level="body-xs" color="neutral" sx={{ fontWeight: 600 }}>Prompt</Typography>
          <Typography data-testid="reflection-prompt" level="body-sm" sx={{ mt: .25 }}>{reflectionPrompt}</Typography>
        </Box>
        {/* Keep the prompt action compact while preserving its name and a 44px touch target. */}
        <IconButton type="button" variant="outlined" color="primary" size="md" disabled={disabled || isSubmitting} aria-label="Another prompt" title="Randomize prompt" onClick={chooseAnotherPrompt} sx={{ minWidth: 44, minHeight: 44, flex: "0 0 auto" }}>
          <ShuffleRounded fontSize="small" />
        </IconButton>
      </Sheet>

      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1.5} flexWrap="wrap">
        {entry ? (
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Date"
                disabled={disabled || isSubmitting}
                value={dayjs(field.value)}
                onChange={(newDate) => newDate && field.onChange(newDate.format("YYYY-MM-DD"))}
                format="MMM D, YYYY"
                slotProps={{ textField: { size: "small", sx: { width: 172 } } }}
              />
            )}
          />
        ) : <Box><Typography component="h2" level="title-md">How are you feeling today?</Typography><Typography level="body-sm" color="neutral" sx={{ mt: .25 }}>{getCheckInSubtext(currentUser?.selectedPathway)}</Typography></Box>}
        <Typography level="body-sm" color={selectedMoods.length > 0 ? "primary" : "neutral"}>
          {selectedMoods.length === 0 ? "Nothing selected" : `${selectedMoods.length} selected`}
        </Typography>
      </Stack>
      {errors.date && (
        <Typography color="danger" level="body-sm">
          {errors.date.message}
        </Typography>
      )}

      {/* Compact labeled mood controls keep the illustrations and their meanings clear at a glance. */}
      <Box role="group" aria-label="Choose one or more moods" sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: { xs: .25, sm: .5 }, width: "100%" }}>
        {moodDefinitions.map((moodDefinition) => {
          const mood = moodDefinition.key;
          const checked = selectedMoods.includes(mood);
          const moodAura = referenceData?.auras.find((aura) => aura.key === moodDefinition.auraColorKeys[0]);
          const moodHue = moodAura?.shades?.[500] ?? moodAura?.baseHex ?? "var(--al-theme-primary)";
          const iconBackground = moodHue
            ? `color-mix(in srgb, ${moodHue} 20%, var(--al-theme-surface))`
            : "var(--al-theme-surface-raised)";
          return (
            <Sheet
              key={mood}
              variant="outlined"
              sx={{
                ...getMoodPillSx(moodHue, { selected: checked, interactive: true }),
                position: "relative",
                minHeight: 44,
                flex: "0 0 auto",
                borderRadius: "999px",
                borderWidth: checked ? 2 : 1,
              }}
            >
              <Checkbox
                id={`mood-${mood.toLowerCase()}`}
                checked={checked}
                aria-describedby={errors.moods ? "mood-error" : undefined}
                disabled={disabled || isSubmitting}
                onChange={() => toggleMood(mood)}
                label={<Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: .75, minWidth: 0 }}>
                  <Box component="span" data-mood-color={moodHue} sx={{ width: 32, height: 32, flex: "0 0 auto", display: "grid", placeItems: "center", borderRadius: "50%", backgroundColor: iconBackground }}>
                    <MoodIcon icon={moodDefinition.icon} size={28} />
                  </Box>
                  <Box component="span" sx={{ color: "text.primary", fontSize: "0.875rem", whiteSpace: "nowrap" }}>{moodDefinition.displayName}</Box>
                </Box>}
                variant="plain"
                size="md"
                uncheckedIcon={<Box component="span" aria-hidden="true" sx={{ width: 0, height: 0 }} />}
                checkedIcon={<Box component="span" aria-hidden="true" sx={{ width: 0, height: 0 }} />}
                sx={{ width: "100%", height: "100%", minHeight: 44, justifyContent: "flex-start", px: .625, py: 0, color: "text.primary", borderRadius: "999px", "& .MuiCheckbox-label": { display: "inline-flex", alignItems: "center" }, "& .MuiCheckbox-checkbox": { position: "absolute", opacity: 0, width: 0, height: 0, overflow: "hidden" } }}
              />
              {checked && <Box aria-hidden="true" sx={{ position: "absolute", bottom: -2, right: -2, width: 14, height: 14, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: "primary.500", color: "primary.contrastText", fontSize: 10, lineHeight: 1, fontWeight: 700 }}>✓</Box>}
            </Sheet>
          );
        })}
      </Box>
      {errors.moods && <Typography id="mood-error" role="alert" color="danger" level="body-sm">{errors.moods.message as string}</Typography>}

      <Typography level="body-xs" color="neutral">Color meanings are optional personal reflection, not a health assessment.</Typography>

      <Controller
        name="comment"
        control={control}
        render={({ field }) => (
          <Box>
            {/* Markdown remains the persisted comment format; the editor is the primary reflection field. */}
            {/* The toolbar takes a restrained derived-aura wash; contrast-safe aura text keeps its controls readable in either interface mode. */}
            {/* The editor overlays an absolute textarea on relative highlighted text; shared parent padding keeps caret and glyph origins aligned. */}
            <Box data-color-mode="light" sx={{ "& .w-md-editor": { borderRadius: "14px", borderColor: errors.comment ? "var(--al-theme-danger)" : "var(--al-theme-control-border)", backgroundColor: "var(--al-theme-surface)", color: "var(--al-theme-ink)", boxShadow: "none", overflow: "hidden" }, "& .w-md-editor-toolbar": { backgroundColor: "color-mix(in srgb, var(--aura-accent, var(--al-theme-primary)) 14%, var(--al-theme-surface-raised))", borderBottomColor: "var(--aura-line, var(--al-theme-border))" }, "& .w-md-editor-toolbar li > button": { color: "var(--al-theme-ink-muted)" }, "& .w-md-editor-toolbar li > button:hover, & .w-md-editor-toolbar li.active > button": { color: "var(--aura-text, var(--al-theme-ink))", backgroundColor: "var(--aura-wash, var(--al-theme-border))" }, "& .w-md-editor-content": { backgroundColor: "transparent" }, "& .w-md-editor-text": { padding: "16px !important" }, "& .w-md-editor-text-pre, & .w-md-editor-text-input": { fontFamily: "inherit", fontSize: "0.98rem", lineHeight: 1.6, color: "var(--al-theme-ink)" }, "& .w-md-editor-text-pre": { padding: 0 }, "& .w-md-editor-text-input": { padding: "inherit" }, "& .w-md-editor-text-pre > code": { fontFamily: "inherit !important", fontSize: "0.98rem !important", lineHeight: "1.6 !important" }, "& .w-md-editor-preview": { padding: "16px", fontFamily: "inherit" } }}>
              <MDEditor
                value={field.value ?? ""}
                onChange={(value) => field.onChange(value ?? "")}
                preview={disabled ? "preview" : "edit"}
                hideToolbar={disabled}
                textareaProps={{ "aria-label": "Reflection", placeholder: "Add a heading, then write a little about your day…", readOnly: disabled || isSubmitting }}
                height={220}
              />
            </Box>
            {errors.comment && <Typography color="danger" level="body-sm" role="alert">{errors.comment.message}</Typography>}
          </Box>
        )}
      />

      {/* Photos attach to the same journal entry while remaining optional. */}
      {!showPhotos && !disabled && (
        <IconButton type="button" variant="outlined" color="neutral" size="md" aria-label="Add photos" onClick={() => setPhotosOpen(true)} sx={{ minWidth: 44, minHeight: 44, alignSelf: "flex-start" }}>
          <AddPhotoAlternateOutlined />
        </IconButton>
      )}
      {showPhotos && <MoodPhotoPicker onChange={setSelectedPhotos} disabled={disabled || isSubmitting} statuses={photoStatuses} />}

      {statusMessage && <Typography role={statusRole} aria-live={statusRole === "alert" ? "assertive" : "polite"} aria-atomic="true" level="body-sm" color={statusRole === "alert" ? "danger" : "primary"}>{statusMessage}</Typography>}

      {/* Give the pathway reflection the same soft, check-in-derived halo as the other focal surfaces. */}
      {interpretationEligible && currentUser && (
        <Sheet variant="soft" sx={{ p: { xs: 1.75, sm: 2.25 }, borderRadius: "lg", border: "1px solid", borderColor: "var(--aura-line, var(--al-theme-border))", boxShadow: "0 0 18px var(--aura-glow, transparent)" }}>
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
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", mt: 0.75 }}>
              {/* #345: the combination's own color, shown with its reflection. Decorative; the text carries the meaning. */}
              {interpretation.hue != null && (
                <Box aria-hidden="true" data-testid="combination-swatch" sx={{ width: 28, height: 28, flexShrink: 0, mt: 0.25, borderRadius: "50%", animation: "aura-shimmer 1.2s ease-out 1", background: `radial-gradient(circle at 33% 28%, rgba(255,255,255,.9), oklch(0.72 0.14 ${interpretation.hue}) 70%)` }} />
              )}
              <Typography level="body-md" sx={{ whiteSpace: "pre-wrap" }}>{interpretation.interpretation}</Typography>
            </Box>
          )}
          {interpretationLoaded && !interpretationLoading && !interpretation && !interpretationError && (
            <Typography level="body-sm" color="neutral" sx={{ mt: 0.75 }}>There isn’t a reflection for this combination yet.</Typography>
          )}
        </Sheet>
      )}

      {/* On phones Save stays pinned above the tab bar; on desktop the short form keeps it in reach. */}
      {showSubmitButton && (
        <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ alignSelf: { xs: "stretch", sm: "flex-end" }, minWidth: 150, minHeight: 44, position: { xs: "sticky", md: "static" }, bottom: "calc(92px + env(safe-area-inset-bottom, 0px))", zIndex: 4, boxShadow: "0 6px 20px var(--al-theme-glow)" }}>
          {submitLabel ?? (entry ? "Update Entry" : "Submit Entry")}
        </Button>
      )}
    </Box>
  );
}
