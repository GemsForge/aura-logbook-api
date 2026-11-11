import Box from "@mui/joy/Box";
import Checkbox from "@mui/joy/Checkbox";
import Typography from "@mui/joy/Typography";
import { AuraButton as Button } from "@/components/ui/AuraButton";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { type MoodEntry, type MoodType, moodEntrySchema } from "@/features/mood/models/schema";
import { useGetReferenceDataQuery } from "@/store/referenceDataApi";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { normalizeSpiritualPathway, type SpiritualPathway } from "@/features/auth/models/SpiritualPathway";
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
// Orbit card centers as [left%, top%] on the compact (~430px) wheel; the top card sits a little
// lower so its tallest group (three moods) stays inside the wheel's box.
const auraOrbitPositions = [
  [50, 13], [78, 20], [89, 43], [82, 71], [58, 87],
  [30, 85], [11, 65], [11, 39], [26, 18],
] as const;

/** Maps the persisted pathway label to the API SpiritualPathway enum key. */
const pathwayKeyByUserPathway: Record<SpiritualPathway, number> = {
  mindfulness: 0,
  energy: 1,
  faith: 2,
};

type JournalingPrompt = { id: string; question: string };
type JournalingPromptPathway = { id: string; prompts: JournalingPrompt[] };

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
  // Optional sections open on request; an existing entry (edit / add-details) shows them directly.
  const [noteOpen, setNoteOpen] = useState(false);
  const [photosOpen, setPhotosOpen] = useState(false);
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
  const showNote = noteOpen || Boolean(entry) || Boolean(watch("comment"));
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
  const reflectionPrompt = promptPathway?.prompts[promptIndex]?.question ?? "What would you like to remember about this moment?";

  const toggleMood = (mood: MoodType) => {
    const updated = selectedMoods.includes(mood)
      ? selectedMoods.filter((m) => m !== mood)
      : [...selectedMoods, mood];
    setValue("moods", updated);
  };

  // group moods by auraColor
  const auraGroups = (referenceData?.auras ?? []).map((aura) => ({
    aura,
    moods: (referenceData?.moods ?? []).filter((mood) => mood.auraColorKeys.includes(aura.key)).map((mood) => mood.key),
  }));

  const onFormSubmit = (data: MoodEntryFormValues) => {
    void onSubmit({
      date: dayjs(data.date).format("YYYY-MM-DD"),
      moods: data.moods,
      comment: data.comment?.trim() || undefined,
    }, selectedPhotos);
  };

  return (
    <Box id="mood-form" component="form" onSubmit={handleSubmit(onFormSubmit)} sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
      {/* The page banner already asks the question, so the form opens straight onto a compact
          date (almost always today) beside the selection count, then the moods. */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1.5}>
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
        <Typography level="body-sm" color={selectedMoods.length > 0 ? "primary" : "neutral"}>
          {selectedMoods.length === 0 ? "Nothing selected" : `${selectedMoods.length} selected`}
        </Typography>
      </Stack>
      {errors.date && (
        <Typography color="danger" level="body-sm">
          {errors.date.message}
        </Typography>
      )}

      <Box sx={{ position: "relative", width: "100%", maxWidth: 540, display: { xs: "flex", sm: "block" }, flexWrap: "wrap", gap: .75, p: 0, minHeight: { xs: "auto", sm: 430 }, mx: "auto", borderRadius: { xs: 0, sm: "50%" }, background: { xs: "none", sm: "radial-gradient(circle, var(--al-theme-surface) 0 20%, color-mix(in srgb, var(--al-theme-surface-raised) 72%, transparent) 20.5% 45%, transparent 45.5%), conic-gradient(from 20deg, color-mix(in srgb, var(--aura-accent) 24%, transparent), color-mix(in srgb, var(--al-theme-accent) 24%, transparent), color-mix(in srgb, var(--aura-accent) 10%, transparent), color-mix(in srgb, var(--al-theme-primary) 18%, transparent), color-mix(in srgb, var(--aura-accent) 24%, transparent))" }, border: { xs: 0, sm: "1px solid var(--al-theme-border)" }, "&::before": { display: { xs: "none", sm: "block" }, content: "\"\"", position: "absolute", inset: "17%", border: "1px dashed color-mix(in srgb, var(--al-theme-ink-muted) 40%, transparent)", borderRadius: "50%" }, "&::after": { display: { xs: "none", sm: "block" }, content: "\"\"", position: "absolute", inset: "31%", border: "1px solid color-mix(in srgb, var(--al-theme-ink-muted) 22%, transparent)", borderRadius: "50%" } }}>
        <Box sx={{ position: "absolute", inset: "32% 22%", display: { xs: "none", sm: "grid" }, placeItems: "center", textAlign: "center", pointerEvents: "none", zIndex: 2 }}>
          <Box sx={{ width: "100%", minHeight: 84, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", p: 1.25, borderRadius: "50%", backgroundColor: "var(--al-theme-surface)", boxShadow: "0 10px 30px var(--al-theme-glow)" }}>
            <Typography level="body-xs" sx={{ color: "neutral.500" }}>{selectedMoods.length ? "Your current mix" : "Your inner weather"}</Typography>
            <Typography level="title-lg" sx={{ mt: 0.5, fontFamily: "display", fontWeight: 400, lineHeight: 1.1 }}>{selectedMoods.length ? selectedMoods.slice(0, 2).join(" · ") : "Choose what feels close"}</Typography>
            {selectedMoods.length > 2 && <Typography level="body-xs" color="neutral" sx={{ mt: 0.5 }}>+ {selectedMoods.length - 2} more</Typography>}
            {!selectedMoods.length && <Typography level="body-xs" color="neutral" sx={{ mt: 0.75 }}>Select one or more colors around you.</Typography>}
          </Box>
        </Box>
        {auraGroups.map(({ aura, moods }, groupIndex) => {
          const color = aura.key;
          if (moods.length === 0) return null;

          const swatch = aura.shades?.[500] ?? aura.baseHex;
          const [left, top] = auraOrbitPositions[groupIndex] ?? [50, 50];
          const selectedInGroup = moods.filter((mood) => selectedMoods.includes(mood)).length;

          return (
            <Sheet key={color} variant="soft" sx={{ display: { xs: "contents", sm: "block" }, position: { xs: "relative", sm: "absolute" }, left: { xs: "auto", sm: `${left}%` }, top: { xs: "auto", sm: `${top}%` }, transform: { xs: "none", sm: "translate(-50%, -50%)" }, width: { xs: "auto", sm: 124 }, p: .75, borderRadius: "12px", backgroundColor: `${swatch}28`, backdropFilter: "blur(8px)", border: "2px solid", borderColor: `${swatch}B8`, boxShadow: `0 8px 24px ${swatch}30`, zIndex: 3, transition: "transform .2s ease, box-shadow .2s ease", "&:hover": { transform: { xs: "translateY(-2px)", sm: "translate(-50%, -50%) scale(1.03)" }, boxShadow: `0 12px 30px ${swatch}5c` } }}>
              <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", mb: .5 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    bgcolor: swatch,
                    borderRadius: "50%",
                    mr: .75,
                  }}
                />
                <Typography level="body-sm" sx={{ color: "neutral.800", textTransform: "capitalize", fontWeight: 700 }}>
                  {color}
                </Typography>
                {selectedInGroup > 0 && <Typography level="body-xs" sx={{ ml: "auto", color: swatch, fontWeight: 700 }}>{selectedInGroup}</Typography>}
              </Box>
              <Box sx={{ display: { xs: "contents", sm: "flex" }, flexDirection: "column" }}>
                {moods.map((mood) => {
                  const moodDefinition = referenceData?.moods.find((definition) => definition.key === mood);
                  const icon = moodDefinition?.icon ?? "";
                  const checked = selectedMoods.includes(mood);
                  const moodAura = referenceData?.auras.find((definition) => definition.key === moodDefinition?.auraColorKeys[0]);
                  const hue = moodAura?.shades?.[500] ?? moodAura?.baseHex ?? swatch;
                  return (
                    <Sheet
                      key={mood}
                      variant={checked ? "solid" : "outlined"}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        borderRadius: { xs: "999px", sm: "md" },
                        borderColor: checked ? hue : { xs: `${hue}B8`, sm: "neutral.200" },
                        minHeight: { xs: 40, sm: "auto" },
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
                        sx={{ width: "100%", color: "neutral.900", px: { xs: 1.25, sm: 0.5 }, "& .MuiCheckbox-label": { fontWeight: checked ? 700 : 500, fontSize: { xs: "0.85rem", sm: "0.72rem" }, lineHeight: 1.25, py: 0.25, whiteSpace: "nowrap" }, "& .MuiCheckbox-checkbox": { opacity: 0, width: 0, height: 0, minWidth: 0, minHeight: 0, p: 0, overflow: "hidden" } }}
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

      <Typography level="body-xs" color="neutral">Color meanings are optional personal reflection, not a health assessment.</Typography>

      {/* Optional extras stay closed until asked for, so a mood-only check-in fits on one screen.
          Editing an entry, or one that already has a note or chosen photos, opens them. */}
      {(!showNote || !showPhotos) && !disabled && (
        <Stack direction="row" gap={1} flexWrap="wrap">
          {!showNote && <Button variant="outlined" size="small" onClick={() => setNoteOpen(true)}>Add a note</Button>}
          {!showPhotos && <Button variant="outlined" size="small" onClick={() => setPhotosOpen(true)}>Add photos</Button>}
        </Stack>
      )}
      {showPhotos && <MoodPhotoPicker onChange={setSelectedPhotos} disabled={disabled || isSubmitting} statuses={photoStatuses} />}

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
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", mt: 0.75 }}>
              {/* #345: the combination's own color, shown with its reflection. Decorative; the text carries the meaning. */}
              {interpretation.hue != null && (
                <Box aria-hidden="true" data-testid="combination-swatch" sx={{ width: 28, height: 28, flexShrink: 0, mt: 0.25, borderRadius: "50%", background: `radial-gradient(circle at 33% 28%, rgba(255,255,255,.9), oklch(0.72 0.14 ${interpretation.hue}) 70%)` }} />
              )}
              <Typography level="body-md" sx={{ whiteSpace: "pre-wrap" }}>{interpretation.interpretation}</Typography>
            </Box>
          )}
          {interpretationLoaded && !interpretationLoading && !interpretation && !interpretationError && (
            <Typography level="body-sm" color="neutral" sx={{ mt: 0.75 }}>There isn’t a reflection for this combination yet.</Typography>
          )}
        </Sheet>
      )}

      {showNote && <Controller
        name="comment"
        control={control}
        render={({ field }) => (
          <Box>
            <Typography level="body-sm" color="neutral" sx={{ mb: .75 }}>{reflectionPrompt}</Typography>
            {/* Markdown remains the persisted comment value, so the editor does not introduce an HTML-only format. */}
            {/* The editor ships light-mode icon colors; toolbar buttons take theme ink so they stay visible in dark themes. */}
            <Box data-color-mode="light" sx={{ "& .w-md-editor": { borderRadius: "14px", borderColor: errors.comment ? "var(--al-theme-danger)" : "var(--al-theme-control-border)", backgroundColor: "var(--al-theme-surface)", color: "var(--al-theme-ink)", boxShadow: "none", overflow: "hidden" }, "& .w-md-editor-toolbar": { backgroundColor: "var(--al-theme-surface-raised)", borderBottomColor: "var(--al-theme-border)" }, "& .w-md-editor-toolbar li > button": { color: "var(--al-theme-ink-muted)" }, "& .w-md-editor-toolbar li > button:hover, & .w-md-editor-toolbar li.active > button": { color: "var(--al-theme-ink)", backgroundColor: "var(--al-theme-border)" }, "& .w-md-editor-content": { backgroundColor: "transparent" }, "& .w-md-editor-text-pre, & .w-md-editor-text-input, & .w-md-editor-text": { fontFamily: "inherit", fontSize: "0.98rem", lineHeight: 1.6, color: "var(--al-theme-ink)" }, "& .w-md-editor-text-input": { padding: "16px" }, "& .w-md-editor-preview": { padding: "16px", fontFamily: "inherit" } }}>
              <MDEditor
                value={field.value ?? ""}
                onChange={(value) => field.onChange(value ?? "")}
                preview={disabled ? "preview" : "edit"}
                hideToolbar={disabled}
                textareaProps={{ "aria-label": "Reflection", placeholder: "Write what you noticed, felt, or want to remember…", readOnly: disabled || isSubmitting }}
                height={140}
              />
            </Box>
            {errors.comment && (
              <Typography color="danger" level="body-sm">
                {errors.comment.message}
              </Typography>
            )}
          </Box>
        )}
      />}

      {/* On phones Save stays pinned above the tab bar; on desktop the short form keeps it in reach. */}
      {showSubmitButton && (
        <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ alignSelf: { xs: "stretch", sm: "flex-end" }, minWidth: 150, minHeight: 44, position: { xs: "sticky", md: "static" }, bottom: "calc(92px + env(safe-area-inset-bottom, 0px))", zIndex: 4, boxShadow: "0 6px 20px var(--al-theme-glow)" }}>
          {submitLabel ?? (entry ? "Update Entry" : "Submit Entry")}
        </Button>
      )}
    </Box>
  );
}
