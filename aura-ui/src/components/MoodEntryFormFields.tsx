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
import { MoodChoiceCarousel } from "@/components/mood/MoodChoiceCarousel";
import { useDailyPathwayReflection } from "@/features/pathways/useDailyPathwayReflection";
import { MoodPathwayReflectionPanel, type MoodReflectionResponse } from "@/features/pathways/components/MoodPathwayReflectionPanel";
import type { MoodPathwayReflection } from "@/features/mood/models/schema/MoodEntry";
import { useGetReferenceDataQuery } from "@/store/referenceDataApi";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { normalizeSpiritualPathway, type SpiritualPathway } from "@/features/auth/models/SpiritualPathway";
import { useGetMoodCombinationInterpretationQuery } from "@/store/auraApi";
import journalingPrompts from "../../data/aura_logbook_journaling_prompts.json";
import MDEditor from "@uiw/react-md-editor";
import MoodPhotoPicker from "@/components/MoodPhotoPicker";
import { getCheckInSubtext } from "@/features/mood/checkInCopy";
import { orderMoodChoices } from "@/features/mood/orderMoodChoices";
import { MOOD_IMPACT_TOPICS } from "@/features/mood/impactTopics";


type MoodEntryFormValues = {
  date: string;
  moods: MoodType[];
  impactTopics: string[];
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
    impactTopics: string[];
    comment?: string;
    pathwayReflection?: MoodPathwayReflection;
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
  const dailyReflection = useDailyPathwayReflection();
  const [reflectionChoice, setReflectionChoice] = useState<{ sourceId: string; text: string; response: MoodReflectionResponse } | null>(entry?.pathwayReflection ? { sourceId: entry.pathwayReflection.sourceId, text: entry.pathwayReflection.text, response: entry.pathwayReflection.response } : null);
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
      impactTopics: entry?.impactTopics ?? [],
      comment: entry?.comment ?? "",
    },
  });

  // Rehydrate the editor whenever a different history entry is opened in the modal.
  useEffect(() => {
    if (!entry) return;
    setReflectionChoice(entry.pathwayReflection ? { sourceId: entry.pathwayReflection.sourceId, text: entry.pathwayReflection.text, response: entry.pathwayReflection.response } : null);
    reset({
      date: dayjs(entry.date).format("YYYY-MM-DD"),
      moods: entry.moods ?? [],
      impactTopics: entry.impactTopics ?? [],
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

  // Use the same positive-first, color-grouped order as Today's compact check-in.
  const moodDefinitions = orderMoodChoices(referenceData?.moods ?? [], referenceData?.auras ?? []);

  const panelReflection = entry?.pathwayReflection ?? (userPathway === "energy" ? dailyReflection.reflection
    : interpretationEligible ? interpretation ? { sourceId: `combination:${interpretation.combinationId}:${userPathway}`, pathway: userPathway, insightType: "mood-combination" as const, text: interpretation.interpretation } : undefined
      : dailyReflection.reflection);
  const panelLoading = !entry?.pathwayReflection && (userPathway === "energy" ? dailyReflection.loading : interpretationEligible && interpretationLoading);
  const panelResponse = panelReflection?.sourceId === reflectionChoice?.sourceId && panelReflection?.text === reflectionChoice?.text ? reflectionChoice?.response : undefined;

  const onFormSubmit = (data: MoodEntryFormValues) => {
    void onSubmit({
      // New entries always use today's local date; edits keep the date selected for that entry.
      date: dayjs(entry ? data.date : undefined).format("YYYY-MM-DD"),
      moods: data.moods,
      impactTopics: data.impactTopics,
      comment: data.comment?.trim() || undefined,
      ...(panelReflection && panelResponse && !panelLoading ? { pathwayReflection: { ...panelReflection, response: panelResponse } } : {}),
    }, selectedPhotos);
  };

  return (
    <Box id="mood-form" component="form" onSubmit={handleSubmit(onFormSubmit)} sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.25fr) minmax(0, 1fr)" }, alignItems: "stretch", gap: { xs: 2, md: 3 }, minWidth: 0 }}>
      <Sheet data-testid="mood-entry-main" variant="soft" sx={{ display: "flex", flexDirection: "column", gap: 1.25, minWidth: 0, p: { xs: 1.5, sm: 2.5 }, borderRadius: "sm", bgcolor: "var(--al-theme-surface-raised)", border: 0 }}>

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

      <MoodChoiceCarousel moods={moodDefinitions} auras={referenceData?.auras ?? []} selected={selectedMoods} onToggle={toggleMood} disabled={disabled || isSubmitting} error={errors.moods?.message as string | undefined} />
      {errors.moods && <Typography id="mood-error" role="alert" color="danger" level="body-sm">{errors.moods.message as string}</Typography>}

      {/* #384: optional, pathway-neutral context. Topics are what the user felt mattered, never a cause we assign. */}
      <Controller name="impactTopics" control={control} render={({ field }) => <Box component="fieldset" sx={{ border: 0, p: { xs: 1.5, sm: 2 }, m: 0, mt: 1, bgcolor: "var(--al-theme-surface)", borderRadius: "sm" }}>
        <Typography component="legend" level="h4" sx={{ float: "left", width: "100%", fontFamily: "var(--joy-fontFamily-display)", fontWeight: 500, mb: .75 }}>What’s having the biggest impact on you? (optional)</Typography>
        <Typography level="body-xs" color="neutral" sx={{ mt: .25 }}>Select any that feel relevant.</Typography>
        <Box role="group" aria-label="Impact topics" sx={{ display: "flex", flexWrap: "wrap", gap: .5, mt: 1 }}>
          {MOOD_IMPACT_TOPICS.map((topic) => <Checkbox key={topic} size="sm" label={topic} sx={{ minHeight: 36, px: .75, py: .25, gap: .5, border: "1px solid var(--al-theme-border)", borderRadius: "sm", fontSize: ".75rem" }}
            checked={(field.value ?? []).includes(topic)} disabled={disabled || isSubmitting}
            onChange={(event) => field.onChange(event.target.checked ? [...(field.value ?? []), topic] : (field.value ?? []).filter((selected) => selected !== topic))} />)}
        </Box>
      </Box>} />


      {/* Keep the prompt readable while letting a light aura wash connect it to the day's reflection. */}
      <Sheet variant="soft" sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, p: { xs: 1, sm: 1.25 }, borderRadius: "sm", backgroundColor: "color-mix(in srgb, var(--aura-accent) 12%, var(--al-theme-surface-raised))", borderInlineStart: "3px solid var(--aura-accent)" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography level="body-xs" color="neutral" sx={{ fontWeight: 600 }}>Prompt</Typography>
          <Typography data-testid="reflection-prompt" level="body-sm" sx={{ mt: .25 }}>{reflectionPrompt}</Typography>
        </Box>
        {/* Keep the prompt action compact while preserving its name and a 44px touch target. */}
        <IconButton type="button" variant="outlined" color="primary" size="md" disabled={disabled || isSubmitting} aria-label="Another prompt" title="Randomize prompt" onClick={chooseAnotherPrompt} sx={{ minWidth: 44, minHeight: 44, flex: "0 0 auto" }}>
          <ShuffleRounded fontSize="small" />
        </IconButton>
      </Sheet>

      <Typography component="label" htmlFor="mood-note" level="body-sm" sx={{ mt: 1 }}>A note for your future self (optional)</Typography>
      <Controller
        name="comment"
        control={control}
        render={({ field }) => (
          <Box>
            {/* Markdown remains the persisted comment format; the editor is the primary reflection field. */}
            {/* The toolbar takes a restrained derived-aura wash; contrast-safe aura text keeps its controls readable in either interface mode. */}
            {/* The editor overlays an absolute textarea on relative highlighted text; shared parent padding keeps caret and glyph origins aligned. */}
            <Box data-color-mode="light" sx={{ "& .w-md-editor": { borderRadius: "6px", borderColor: errors.comment ? "var(--al-theme-danger)" : "var(--al-theme-control-border)", backgroundColor: "var(--al-theme-surface)", color: "var(--al-theme-ink)", boxShadow: "none", overflow: "hidden" }, "& .w-md-editor-toolbar": { backgroundColor: "color-mix(in srgb, var(--aura-accent, var(--al-theme-primary)) 14%, var(--al-theme-surface-raised))", borderBottomColor: "var(--aura-line, var(--al-theme-border))" }, "& .w-md-editor-toolbar li > button": { color: "var(--al-theme-ink-muted)" }, "& .w-md-editor-toolbar li > button:hover, & .w-md-editor-toolbar li.active > button": { color: "var(--aura-text, var(--al-theme-ink))", backgroundColor: "var(--aura-wash, var(--al-theme-border))" }, "& .w-md-editor-content": { backgroundColor: "transparent" }, "& .w-md-editor-text": { padding: "16px !important" }, "& .w-md-editor-text-pre, & .w-md-editor-text-input": { fontFamily: "inherit", fontSize: "0.98rem", lineHeight: 1.6, color: "var(--al-theme-ink)" }, "& .w-md-editor-text-pre": { padding: 0 }, "& .w-md-editor-text-input": { padding: "inherit" }, "& .w-md-editor-text-pre > code": { fontFamily: "inherit !important", fontSize: "0.98rem !important", lineHeight: "1.6 !important" }, "& .w-md-editor-preview": { padding: "16px", fontFamily: "inherit" } }}>
              <MDEditor
                value={field.value ?? ""}
                onChange={(value) => field.onChange(value ?? "")}
                preview={disabled ? "preview" : "edit"}
                hideToolbar={disabled}
                textareaProps={{ "aria-label": "Reflection", id: "mood-note", placeholder: "What would you like to remember about this moment?", readOnly: disabled || isSubmitting }}
                height={140}
              />
            </Box>
            {errors.comment && <Typography color="danger" level="body-sm" role="alert">{errors.comment.message}</Typography>}
          </Box>
        )}
      />

      {showPhotos && <MoodPhotoPicker onChange={setSelectedPhotos} disabled={disabled || isSubmitting} statuses={photoStatuses} />}

      {statusMessage && <Typography role={statusRole} aria-live={statusRole === "alert" ? "assertive" : "polite"} aria-atomic="true" level="body-sm" color={statusRole === "alert" ? "danger" : "primary"}>{statusMessage}</Typography>}

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mt: 1 }}>
      {/* Photos attach to the same journal entry while remaining optional. */}
      {!showPhotos && !disabled && (
        <IconButton type="button" variant="outlined" color="neutral" size="sm" aria-label="Add photos" onClick={() => setPhotosOpen(true)} sx={{ minWidth: 44, minHeight: 44, alignSelf: "flex-start" }}>
          <AddPhotoAlternateOutlined fontSize="small" />
        </IconButton>
      )}
      {/* On phones Save stays pinned above the tab bar; on desktop the short form keeps it in reach. */}
      {showSubmitButton && (
        <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ alignSelf: { xs: "stretch", sm: "flex-end" }, minWidth: 88, minHeight: 40, px: 1.5, py: .5, position: { xs: "sticky", md: "static" }, bottom: "calc(92px + env(safe-area-inset-bottom, 0px))", zIndex: 4, boxShadow: "none", borderRadius: "sm", ml: "auto" }}>
          {submitLabel ?? (entry ? "Update Entry" : "Submit Entry")}
        </Button>
      )}
      </Box>
      </Sheet>
      <MoodPathwayReflectionPanel reflection={panelReflection} response={panelResponse} onChange={(response) => panelReflection && setReflectionChoice({ sourceId: panelReflection.sourceId, text: panelReflection.text, response })} loading={panelLoading} disabled={disabled || isSubmitting} editing={Boolean(entry)} error={!entry?.pathwayReflection && userPathway !== "energy" && interpretationEligible && interpretationError} onRetry={refetchInterpretation} />
    </Box>
  );
}
