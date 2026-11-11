import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Divider from "@mui/joy/Divider";
import Grid from "@mui/joy/Grid";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import WeatherCard from "@/components/weather/WeatherCard";
import { useWeatherLocation } from "@/hooks/useWeatherLocation";
import { AuraColorInfo, AuraMoodMap, MoodIcons } from "@/features/mood/models/aura";
import { MoodTypes, type MoodType } from "@/features/mood/models/schema/MoodType";
import { getQuickMoodNextStep } from "@/features/mood/quickMoodNextStep";
import { buildWeekMoodStrip, summarizeMoodPatterns } from "@/features/mood/moodPatternSummary";
import { auraPalettes } from "@/theme/auraTheme";
import { useGetZodiacInsightQuery } from "@/store/auraApi";
import { useGetCurrentUserQuery } from "@/store/authApi";
import { useGetAllMoodsQuery, useGetDashboardSummaryQuery, useGetMoodByIdQuery, useLogMoodMutation } from "@/store/moodApi";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { useAppSelector } from "@/store/hooks";
import { getTimeGreeting } from "@/util/timeGreeting";
import dayjs from "dayjs";
import { normalizeSpiritualPathway, type SpiritualPathway } from "@/features/auth/models/SpiritualPathway";
import dailyQuotes from "../../data/aura_logbook_daily_quotes.json";
// Renders saved reflection Markdown in the recent-entries list.
import MarkdownReflection from "@/components/MarkdownReflection";
import SpotifyConnectionCard from "@/components/profile/SpotifyConnectionCard";
import MoodUpdateModal from "@/components/MoodUpdateModal";
import journalingPrompts from "../../data/aura_logbook_journaling_prompts.json";

type DailyQuote = { id: string; text: string; theme: string; author: string };
type DailyQuotePathway = { id: string; title: string; quotes: DailyQuote[] };
type JournalingPromptPathway = { id: string; prompts: Array<{ id: string; question: string }> };

/** Maps the profile pathway (enum key or display label) to its prompt-library identifier. */
const dailyQuotePathwayIds: Record<SpiritualPathway, string> = { Mindfulness: "mindful", Energy: "astrology-energy", Faith: "faith-religion" };
const resolveDailyQuotePathwayId = (pathway?: string) => dailyQuotePathwayIds[normalizeSpiritualPathway(pathway) ?? "Mindfulness"];

// A module-load seed rotates the prompt on reload while keeping ordinary rerenders stable.
const dailyQuoteReloadSeed = Math.random();

/** Outlined secondary actions under the chips: clearly buttons, with a 44px touch target on phones. */
const quickActionSx = { minHeight: { xs: 44, sm: 36 }, borderColor: "var(--al-theme-control-border)" } as const;

/** Keeps Today focused on checking in, glancing at the week, and remembering recent writing. */
export default function Dashboard() {
  const navigate = useNavigate();
  const greeting = getTimeGreeting();
  const user = useAppSelector(selectCurrentUser);
  const today = dayjs().format("YYYY-MM-DD");
  const { isLoading: loadingUser } = useGetCurrentUserQuery();
  const { data: entries = [], isLoading: loadingToday, isError: entriesError, refetch: refetchEntries } = useGetAllMoodsQuery();
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummaryQuery();
  const [logMood] = useLogMoodMutation();
  const [quickCheckIn, setQuickCheckIn] = useState<{ mood: MoodType; saved: boolean; entryId?: number } | null>(null);
  const quickMoodEntry = useGetMoodByIdQuery(quickCheckIn?.entryId ?? 0, { skip: !quickCheckIn?.saved || !quickCheckIn.entryId });
  const [showMoreMoods, setShowMoreMoods] = useState(false);
  const [isSavingQuickMood, setIsSavingQuickMood] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const quickMoodSubmitInProgress = useRef(false);
  // Focus targets for the check-in: the saved confirmation, and the chip group it replaces.
  const savedStateRef = useRef<HTMLDivElement>(null);
  const moodGroupRef = useRef<HTMLDivElement>(null);
  const returnFocusToChips = useRef(false);
  // Celestial data is neither requested nor rendered on shared/default pathways.
  // #331: weather follows the user's own setting; with it off, nothing is requested.
  const weatherLocation = useWeatherLocation(user);
  const showAstrologyContent = user?.selectedPathway === "Energy";
  const { data: zodiac, isLoading: loadingZodiac } = useGetZodiacInsightQuery(undefined, { skip: !showAstrologyContent });

  const dailyQuotePathwayId = resolveDailyQuotePathwayId(user?.selectedPathway);
  const dailyQuotePathway = (dailyQuotes.pathways as DailyQuotePathway[]).find(({ id }) => id === dailyQuotePathwayId);
  const dailyQuoteIndex = Math.floor(dailyQuoteReloadSeed * (dailyQuotePathway?.quotes.length || 1));
  const dailyQuote = dailyQuotePathway?.quotes[dailyQuoteIndex];
  const journalingPathway = (journalingPrompts.pathways as JournalingPromptPathway[]).find(({ id }) => id === dailyQuotePathwayId);
  const nextStep = quickCheckIn?.saved ? getQuickMoodNextStep(quickCheckIn.mood, journalingPathway?.prompts[0]?.question) : null;
  // One persisted source drives today's entry and recent reflections.
  const recentEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  const weekStrip = buildWeekMoodStrip(recentEntries);
  // One-line weekly pattern shown under This week; the full Insights page repeats it with the breakdown.
  const patternSummary = summarizeMoodPatterns(recentEntries);
  const weeklyCheckInCount = weekStrip.reduce((sum, day) => sum + day.entryCount, 0);
  const loading = loadingUser || loadingToday || loadingSummary || (showAstrologyContent && loadingZodiac);

  // Saving unmounts the tapped chip, which would drop keyboard focus to the page body. Move it to
  // the confirmation instead, and back to the first chip when the user chooses "Done".
  const quickCheckInSaved = quickCheckIn?.saved ?? false;
  useEffect(() => {
    if (quickCheckInSaved) {
      savedStateRef.current?.focus();
    } else if (returnFocusToChips.current) {
      returnFocusToChips.current = false;
      moodGroupRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    }
  }, [quickCheckInSaved]);

  if (loading) {
    return <Box sx={{ py: 12, textAlign: "center" }}><Typography level="body-lg">Gathering your reflections…</Typography></Box>;
  }

  const displayName = user?.displayName ?? "Friend";
  const totalEntries = summary?.totalEntries ?? 0;
  const mostFrequent = summary?.mostFrequentMood ?? "";
  const lastMood = recentEntries[0]?.moods[0];
  const summaryLine = totalEntries === 0
    ? "No check-ins yet. Your first one can be small."
    : `${totalEntries} ${totalEntries === 1 ? "entry" : "entries"}${mostFrequent ? ` · most often ${mostFrequent}` : ""}${lastMood ? ` · latest ${lastMood}` : ""}`;
  const quickMoods = showMoreMoods ? MoodTypes : MoodTypes.slice(0, 6);

  /** Creates one check-in per deliberate chip selection; the mutation state prevents rapid duplicate taps. */
  const submitQuickMood = async (mood: MoodType) => {
    if (quickMoodSubmitInProgress.current) return;
    quickMoodSubmitInProgress.current = true;
    setIsSavingQuickMood(true);
    setQuickCheckIn({ mood, saved: false });
    try {
      const created = await logMood({ date: today, moods: [mood] }).unwrap();
      setQuickCheckIn({ mood, saved: true, entryId: created.id });
    } catch {
      setQuickCheckIn({ mood, saved: false });
    } finally {
      quickMoodSubmitInProgress.current = false;
      setIsSavingQuickMood(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1240, mx: "auto" }}>
      <Sheet className="aura-panel" sx={{ p: { xs: 2, sm: 2.5 }, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={1.5}>
          <Box><Typography level="h1" sx={{ fontSize: { xs: "1.7rem", sm: "1.9rem" }, fontWeight: 450, lineHeight: 1.15 }}>{greeting}, {displayName}.</Typography><Typography level="body-sm" color="neutral" sx={{ mt: .5 }}>{dayjs().format("dddd, MMMM D")}</Typography></Box>
          <WeatherCard location={weatherLocation} />
        </Stack>
        <Box sx={{ mt: 2 }}><Typography level="h2" sx={{ fontSize: "1.15rem", fontWeight: 500 }}>How are you feeling today?</Typography>
          {/* The check-in sizes to its content. The saved moment is taller than the chips, so the cards below move down only in direct response to the tap (not an unexpected layout shift), and return to place on "Done"; e2e/quick-check-in.spec.ts measures both. */}
          {/* Always mounted so screen readers announce the save; a live region inserted together with its text is often skipped. */}
          <Box role="status" aria-live="polite" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>{quickCheckIn?.saved ? `Logged ${quickCheckIn.mood}. Thank you for checking in.` : ""}</Box>
          {quickCheckIn?.saved ? <Box ref={savedStateRef} tabIndex={-1} role="group" aria-label="Check-in saved" sx={{ mt: 1, "&:focus-visible": { outline: "2px solid var(--al-theme-focus)", outlineOffset: 4, borderRadius: "8px" } }}><Typography level="body-sm">Logged. Thank you for checking in.</Typography><Stack direction="row" alignItems="center" gap={.75} sx={{ mt: .5 }}><Typography level="body-sm">{MoodIcons[quickCheckIn.mood]} {quickCheckIn.mood} · {quickMoodEntry.data?.createdAt ? dayjs(quickMoodEntry.data.createdAt).format("h:mm A") : dayjs().format("h:mm A")}</Typography><Box aria-hidden="true" sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: auraPalettes[AuraMoodMap[quickCheckIn.mood].auraColor][500].main }} /><Typography level="body-xs" color="neutral">{AuraColorInfo[AuraMoodMap[quickCheckIn.mood].auraColor].name} reflection color</Typography></Stack><Stack direction="row" gap={1} sx={{ mt: .5 }}><Button variant="plain" disabled={!quickMoodEntry.data} onClick={() => setShowDetailModal(true)}>Add a note or photo</Button><Button variant="plain" color="neutral" onClick={() => { returnFocusToChips.current = true; setQuickCheckIn(null); }}>Done</Button></Stack>{nextStep && <Box sx={{ mt: .75, p: 1, borderRadius: "md", bgcolor: "var(--aura-wash)" }}><Typography level="body-xs" color="neutral">A gentle next step</Typography><Typography level="body-sm">{nextStep.prompt}</Typography></Box>}</Box>
            : <Box sx={{ mt: 1 }}><Box ref={moodGroupRef} role="group" aria-label="How are you feeling today?" sx={{ display: "flex", flexWrap: "wrap", gap: .75 }}>{quickMoods.map(mood => <Button key={mood} size="sm" variant="soft" color="neutral" disabled={isSavingQuickMood} aria-label={mood} onClick={() => void submitQuickMood(mood)} sx={{ color: "var(--al-theme-ink)" }}>{MoodIcons[mood]} {mood}</Button>)}</Box><Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" sx={{ mt: 1.25 }}><Button size="sm" variant="outlined" color="neutral" sx={quickActionSx} onClick={() => setShowMoreMoods(value => !value)} aria-expanded={showMoreMoods}>{showMoreMoods ? "Fewer moods" : "More moods"}</Button><Button size="sm" variant="outlined" sx={quickActionSx} onClick={() => navigate("/log-mood")}>Add more detail</Button></Stack>{quickCheckIn && !quickCheckIn.saved && <Typography role="alert" level="body-sm" color="danger" sx={{ mt: .5 }}>That check-in didn’t save. <Button variant="plain" disabled={isSavingQuickMood} onClick={() => void submitQuickMood(quickCheckIn.mood)}>Retry {quickCheckIn.mood}</Button></Typography>}</Box>}
          {entriesError && <Typography role="alert" level="body-sm" color="danger">Your entries couldn’t be loaded. <Button variant="plain" onClick={() => refetchEntries()}>Retry</Button></Typography>}
          <Typography level="body-xs" color="neutral" sx={{ mt: 1.5 }}>{summaryLine}</Typography>
        </Box>
      </Sheet>
      <Grid container spacing={2}>
        <Grid xs={12} md={7}><Sheet className="aura-panel" sx={{ p: 2, height: "100%" }}><Typography level="h3" sx={{ fontSize: "1.1rem", mb: .5 }}>This week</Typography><Box role="list" aria-label="Mood check-ins for the last seven days" sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: .5, mt: 1.25 }}>{weekStrip.map(day => <Box key={day.date} role="listitem" aria-label={`${day.label}, ${day.date}: ${day.mood ?? "No check-in"}`} sx={{ minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: .35 }}><Typography level="body-xs" color="neutral">{day.label}</Typography><Box aria-hidden="true" sx={{ width: 16, height: 16, borderRadius: "50%", border: "1px solid var(--aura-line)", bgcolor: day.auraColor ? auraPalettes[day.auraColor as keyof typeof auraPalettes][500].main : "transparent" }} /><Typography level="body-xs" sx={{ maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{day.mood ?? "—"}</Typography></Box>)}</Box><Typography level="body-xs" color="neutral" sx={{ mt: 1 }}> {weeklyCheckInCount} {weeklyCheckInCount === 1 ? "check-in" : "check-ins"} this week · Missing a day costs nothing.</Typography><Typography level="body-sm" sx={{ mt: .5 }}>{patternSummary}</Typography></Sheet></Grid>
        <Grid xs={12} md={5}><Sheet className="aura-dark-panel" sx={{ p: 2, height: "100%" }}><Typography level="h3" sx={{ color: "inherit", fontSize: "1.1rem" }}>A thought for today</Typography><Typography level="body-md" sx={{ color: "inherit", lineHeight: 1.45, my: 1 }}>“{dailyQuote?.text ?? "What would you like to notice about today?"}”</Typography><Stack direction="row" gap={1} alignItems="center" flexWrap="wrap"><Typography level="body-xs" sx={{ color: "inherit", opacity: .75 }}>{dailyQuote?.author ?? "Aura Logbook"}</Typography><Typography level="body-xs" sx={{ color: "inherit", px: 1, py: .25, borderRadius: 99, bgcolor: "rgba(255,255,255,.16)" }}>{dailyQuotePathway?.title ?? "Mindful"}</Typography></Stack></Sheet></Grid>
        <Grid xs={12}><Sheet className="aura-panel" sx={{ p: 2 }}><Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}><Typography level="h3" sx={{ fontSize: "1.1rem" }}>Recent reflections</Typography><Button variant="plain" onClick={() => navigate("/history")}>See all</Button></Stack><Stack divider={<Divider />} sx={{ mt: .5 }}>
          {!recentEntries.length && <Typography level="body-sm" color="neutral" sx={{ py: 1 }}>Your recent writing will be here when you’re ready.</Typography>}
          {recentEntries.slice(0, 3).map(entry => <Box key={entry.id} sx={{ py: 1 }}><Stack direction="row" justifyContent="space-between" gap={1}><Typography level="title-sm">{entry.moods.map(mood => `${MoodIcons[mood]} ${mood}`).join(" · ")}</Typography><Typography level="body-xs" color="neutral">{dayjs(entry.date).format("MMM D")}</Typography></Stack>{entry.comment && <Box sx={{ mt: .5 }}><MarkdownReflection value={entry.comment} /></Box>}</Box>)}
        </Stack></Sheet></Grid>
        <Grid xs={12}><details><summary style={{ cursor: "pointer", padding: "12px 16px", borderRadius: 12, background: "var(--aura-wash)" }}>Music</summary><Box sx={{ mt: 1 }}><SpotifyConnectionCard /></Box></details></Grid>
        {showAstrologyContent && zodiac && <Grid xs={12}><Sheet className="aura-panel" sx={{ p: 2 }}><Typography level="h3">A lens for reflection</Typography><Typography level="body-sm" color="neutral">{zodiac.sign} · {zodiac.element} · {String(zodiac.insights?.[0]?.message ?? "")}</Typography></Sheet></Grid>}
      </Grid>
      {showDetailModal && quickMoodEntry.data && <MoodUpdateModal entry={quickMoodEntry.data} title="Add a note or photo" saveLabel="Save details" onClose={() => setShowDetailModal(false)} onSuccess={() => { void refetchEntries(); void quickMoodEntry.refetch(); }} />}
    </Box>
  );
}
