import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Link from "@mui/joy/Link";
import Divider from "@mui/joy/Divider";
import Grid from "@mui/joy/Grid";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import WeatherCard from "@/components/weather/WeatherCard";
import { MoodIcons } from "@/features/mood/models/aura";
import { MoodTypes, type MoodType } from "@/features/mood/models/schema/MoodType";
import { useGetZodiacInsightQuery } from "@/store/auraApi";
import { useGetCurrentUserQuery } from "@/store/authApi";
import { useGetAllMoodsQuery, useGetDashboardSummaryQuery, useGetMoodBreakdownQuery, useGetMoodsByDateRangeQuery, useLogMoodMutation } from "@/store/moodApi";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { useAppSelector } from "@/store/hooks";
import { getTimeGreeting } from "@/util/timeGreeting";
import dayjs from "dayjs";
import MoodPieChart from "@/components/dashboard/MoodPieChart";
import MoodTimelineChart from "@/components/dashboard/MoodTimeLineChart";
import dailyQuotes from "../../data/aura_logbook_daily_quotes.json";
import MarkdownReflection from "@/components/MarkdownReflection";
import SpotifyConnectionCard from "@/components/profile/SpotifyConnectionCard";

type DailyQuote = { id: string; text: string; theme: string; author: string };
type DailyQuotePathway = { id: string; title: string; quotes: DailyQuote[] };

/** Maps enum values or display labels from the profile API to prompt-library identifiers. */
const resolveDailyQuotePathwayId = (pathway?: string) => {
  switch (pathway?.trim().toLowerCase()) {
    case "energy":
    case "astrology & energy":
      return "astrology-energy";
    case "faith":
    case "faith & religion":
    case "christian faith":
      return "faith-religion";
    case "mindfulness":
    case "mindful living":
    default:
      return "mindful";
  }
};

// A module-load seed rotates the prompt on reload while keeping ordinary rerenders stable.
const dailyQuoteReloadSeed = Math.random();

/** Keeps Today focused on checking in, glancing at the week, and remembering recent writing. */
export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const greeting = getTimeGreeting();
  const user = useAppSelector(selectCurrentUser);
  const today = dayjs().format("YYYY-MM-DD");
  const { isLoading: loadingUser } = useGetCurrentUserQuery();
  const { data: entries = [], isLoading: loadingToday, isError: entriesError, refetch: refetchEntries } = useGetAllMoodsQuery();
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummaryQuery();
  const { data: breakdown, isLoading: loadingBreakdown } = useGetMoodBreakdownQuery(false);
  const { data: timeline, isLoading: loadingTimeline } = useGetMoodsByDateRangeQuery("7d");
  const [logMood] = useLogMoodMutation();
  const [quickCheckIn, setQuickCheckIn] = useState<{ mood: MoodType; saved: boolean } | null>(null);
  const [showMoreMoods, setShowMoreMoods] = useState(false);
  const [isSavingQuickMood, setIsSavingQuickMood] = useState(false);
  const quickMoodSubmitInProgress = useRef(false);
  // Celestial data is neither requested nor rendered on shared/default pathways.
  const showAstrologyContent = user?.selectedPathway === "Energy";
  const { data: zodiac, isLoading: loadingZodiac } = useGetZodiacInsightQuery(undefined, { skip: !showAstrologyContent });

  const dailyQuotePathwayId = resolveDailyQuotePathwayId(user?.selectedPathway);
  const dailyQuotePathway = (dailyQuotes.pathways as DailyQuotePathway[]).find(({ id }) => id === dailyQuotePathwayId);
  const dailyQuoteIndex = Math.floor(dailyQuoteReloadSeed * (dailyQuotePathway?.quotes.length || 1));
  const dailyQuote = dailyQuotePathway?.quotes[dailyQuoteIndex];
  // One persisted source drives today's entry and recent reflections.
  const recentEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  const todayEntry = recentEntries.find(entry => dayjs(entry.date).format("YYYY-MM-DD") === today);
  const loading = loadingUser || loadingToday || loadingSummary || loadingBreakdown || loadingTimeline || (showAstrologyContent && loadingZodiac);
  // Scroll to the Insights destination after asynchronous dashboard data has rendered it.
  useEffect(() => {
    if (location.hash !== "#insights" || loading) return;
    const section = document.getElementById("insights");
    section?.scrollIntoView({ block: "start" });
    section?.focus({ preventScroll: true });
  }, [location.hash, loading]);

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
      await logMood({ date: today, moods: [mood] }).unwrap();
      setQuickCheckIn({ mood, saved: true });
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
          <WeatherCard compact city="Atlanta" state="GA" country="US" />
        </Stack>
        <Box sx={{ mt: 2 }}><Typography level="h2" sx={{ fontSize: "1.15rem", fontWeight: 500 }}>How are you feeling today?</Typography>
          {quickCheckIn?.saved ? <Box aria-live="polite" sx={{ mt: 1, minHeight: 74 }}><Typography level="body-sm">Logged. Thank you for checking in.</Typography><Typography level="body-sm" sx={{ mt: .5 }}>{MoodIcons[quickCheckIn.mood]} {quickCheckIn.mood} · {dayjs().format("h:mm A")}</Typography><Stack direction="row" gap={1} sx={{ mt: .5 }}><Button variant="plain" onClick={() => navigate("/log-mood", { state: { preselectedMood: quickCheckIn.mood } })}>Add more detail</Button><Button variant="plain" color="neutral" onClick={() => setQuickCheckIn(null)}>Done</Button></Stack></Box>
            : <Box sx={{ mt: 1, minHeight: 74 }}><Box role="group" aria-label="How are you feeling today?" sx={{ display: "flex", flexWrap: "wrap", gap: .75 }}>{quickMoods.map(mood => <Button key={mood} size="sm" variant="soft" color="neutral" disabled={isSavingQuickMood} aria-label={mood} onClick={() => void submitQuickMood(mood)}>{MoodIcons[mood]} {mood}</Button>)}</Box><Stack direction="row" gap={1.5} alignItems="center" sx={{ mt: .5 }}><Button variant="plain" color="neutral" onClick={() => setShowMoreMoods(value => !value)} aria-expanded={showMoreMoods}>{showMoreMoods ? "Fewer moods" : "More moods"}</Button><Button variant="plain" onClick={() => navigate("/log-mood")}>Add more detail</Button></Stack>{quickCheckIn && !quickCheckIn.saved && <Typography role="alert" level="body-sm" color="danger" sx={{ mt: .5 }}>That check-in didn’t save. <Button variant="plain" disabled={isSavingQuickMood} onClick={() => void submitQuickMood(quickCheckIn.mood)}>Retry {quickCheckIn.mood}</Button></Typography>}</Box>}
          {todayEntry?.comment && !quickCheckIn && <Box sx={{ mt: .75 }}><MarkdownReflection value={todayEntry.comment} /></Box>}
          {entriesError && <Typography role="alert" level="body-sm" color="danger">Your entries couldn’t be loaded. <Button variant="plain" onClick={() => refetchEntries()}>Retry</Button></Typography>}
          <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap" sx={{ mt: 1.5 }}><Button component={Link} href="/log-mood" variant="solid">Log your mood</Button><Typography level="body-xs" color="neutral">{summaryLine}</Typography></Stack>
        </Box>
      </Sheet>
      <Grid container spacing={2}>
        <Grid xs={12} md={7}><Sheet className="aura-panel" sx={{ p: 2, minHeight: 180 }}><Typography level="h3" sx={{ fontSize: "1.1rem", mb: .5 }}>This week</Typography><Typography level="body-sm" color="neutral">A simple look at your recent check-ins</Typography><Box sx={{ mt: 1, maxHeight: 120, overflow: "hidden" }}><MoodTimelineChart data={timeline || []} /></Box></Sheet></Grid>
        <Grid xs={12} md={5}><Sheet className="aura-dark-panel" sx={{ p: 2, minHeight: 180 }}><Typography level="h3" sx={{ color: "inherit", fontSize: "1.1rem" }}>A thought for today</Typography><Typography level="body-md" sx={{ color: "inherit", lineHeight: 1.45, my: 1 }}>“{dailyQuote?.text ?? "What would you like to notice about today?"}”</Typography><Stack direction="row" gap={1} alignItems="center" flexWrap="wrap"><Typography level="body-xs" sx={{ color: "inherit", opacity: .75 }}>{dailyQuote?.author ?? "Aura Logbook"}</Typography><Typography level="body-xs" sx={{ color: "inherit", px: 1, py: .25, borderRadius: 99, bgcolor: "rgba(255,255,255,.16)" }}>{dailyQuotePathway?.title ?? "Mindful"}</Typography></Stack></Sheet></Grid>
        <Grid xs={12}><Sheet className="aura-panel" sx={{ p: 2 }}><Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}><Typography level="h3" sx={{ fontSize: "1.1rem" }}>Recent reflections</Typography><Button variant="plain" onClick={() => navigate("/history")}>See all</Button></Stack><Stack divider={<Divider />} sx={{ mt: .5 }}>
          {!recentEntries.length && <Typography level="body-sm" color="neutral" sx={{ py: 1 }}>Your recent writing will be here when you’re ready.</Typography>}
          {recentEntries.slice(0, 3).map(entry => <Box key={entry.id} sx={{ py: 1 }}><Stack direction="row" justifyContent="space-between" gap={1}><Typography level="title-sm">{entry.moods.map(mood => `${MoodIcons[mood]} ${mood}`).join(" · ")}</Typography><Typography level="body-xs" color="neutral">{dayjs(entry.date).format("MMM D")}</Typography></Stack>{entry.comment && <Box sx={{ mt: .5 }}><MarkdownReflection value={entry.comment} /></Box>}</Box>)}
        </Stack></Sheet></Grid>
        <Grid xs={12}><details><summary style={{ cursor: "pointer", padding: "12px 16px", borderRadius: 12, background: "var(--aura-wash)" }}>Music</summary><Box sx={{ mt: 1 }}><SpotifyConnectionCard /></Box></details></Grid>
        {showAstrologyContent && zodiac && <Grid xs={12}><Sheet className="aura-panel" sx={{ p: 2 }}><Typography level="h3">A lens for reflection</Typography><Typography level="body-sm" color="neutral">{zodiac.sign} · {zodiac.element} · {String(zodiac.insights?.[0]?.message ?? "")}</Typography></Sheet></Grid>}
        <Grid xs={12}><Sheet id="insights" tabIndex={-1} className="aura-panel" sx={{ p: 2, scrollMarginTop: 24 }}><Typography level="h3" sx={{ fontSize: "1.1rem" }}>Insights</Typography><Typography level="body-sm" color="neutral">Your recent pattern · mood over the last 7 days</Typography><Box sx={{ mt: 1, maxHeight: 180, overflow: "hidden" }}><MoodTimelineChart data={timeline || []} /></Box>{breakdown && breakdown.length > 0 && <Box sx={{ mt: 2 }}><MoodPieChart data={breakdown} /></Box>}{showAstrologyContent && zodiac && <Box sx={{ mt: 2 }}><Typography level="title-md">{zodiac.sign} • {zodiac.element}</Typography><Typography level="body-sm" color="neutral">{String(zodiac.description ?? "")}</Typography><Typography level="body-sm" color="neutral">{String(zodiac.insights?.[0]?.message ?? "")}</Typography></Box>}</Sheet></Grid>
      </Grid>
    </Box>
  );
}
