import { useNavigate } from "react-router-dom";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Link from "@mui/joy/Link";
import Divider from "@mui/joy/Divider";
import Grid from "@mui/joy/Grid";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import WeatherCard from "@/components/weather/WeatherCard";
import { SpiritualPathwayDescriptions } from "@/features/auth/models/SpiritualPathway";
import { MoodIcons } from "@/features/mood/models/aura";
import { useGetZodiacInsightQuery } from "@/store/auraApi";
import { useGetCurrentUserQuery } from "@/store/authApi";
import { useGetAllMoodsQuery, useGetDashboardSummaryQuery, useGetMoodBreakdownQuery, useGetMoodsByDateRangeQuery } from "@/store/moodApi";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { useAppSelector } from "@/store/hooks";
import { getTimeGreeting } from "@/util/timeGreeting";
import dayjs from "dayjs";
import MoodPieChart from "@/components/dashboard/MoodPieChart";
import MoodStatCard from "@/components/dashboard/MoodStatCard";
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

/** Composes the Luminous Journal dashboard from saved entries, daily guidance and live integrations. */
export default function Dashboard() {
  const navigate = useNavigate();
  const greeting = getTimeGreeting();
  const user = useAppSelector(selectCurrentUser);
  const today = dayjs().format("YYYY-MM-DD");
  const { isLoading: loadingUser } = useGetCurrentUserQuery();
  const { data: entries = [], isLoading: loadingToday, isError: entriesError, refetch: refetchEntries } = useGetAllMoodsQuery();
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummaryQuery();
  const { data: breakdown, isLoading: loadingBreakdown } = useGetMoodBreakdownQuery(false);
  const { data: timeline, isLoading: loadingTimeline } = useGetMoodsByDateRangeQuery("7d");
  const { data: zodiac, isLoading: loadingZodiac } = useGetZodiacInsightQuery();

  const dailyQuotePathwayId = resolveDailyQuotePathwayId(user?.selectedPathway);
  const dailyQuotePathway = (dailyQuotes.pathways as DailyQuotePathway[]).find(({ id }) => id === dailyQuotePathwayId);
  const dailyQuoteIndex = Math.floor(dailyQuoteReloadSeed * (dailyQuotePathway?.quotes.length || 1));
  const dailyQuote = dailyQuotePathway?.quotes[dailyQuoteIndex];
  // One persisted source drives today's entry and recent reflections.
  const recentEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  const todayEntry = recentEntries.find(entry => dayjs(entry.date).format("YYYY-MM-DD") === today);
  const loading = loadingUser || loadingToday || loadingSummary || loadingBreakdown || loadingTimeline || loadingZodiac;
  if (loading) {
    return <Box sx={{ py: 12, textAlign: "center" }}><Typography level="body-lg">Gathering your reflections…</Typography></Box>;
  }

  const displayName = user?.displayName ?? "Friend";
  const totalEntries = summary?.totalEntries ?? 0;
  const mostFrequent = summary?.mostFrequentMood ?? "";
  const currentStreak = summary?.currentStreak ?? 0;
  const lastEntryDate = summary?.lastEntryDate && dayjs(summary.lastEntryDate).isValid()
    ? dayjs(summary.lastEntryDate).format("MMMM D, YYYY")
    : "No entries yet";

  return (
    <Box sx={{ maxWidth: 1240, mx: "auto" }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "flex-end" }} gap={2} sx={{ mb: 4 }}>
        <Box><Typography className="aura-eyebrow" color="neutral" sx={{ mb: 1.5 }}>Your space to come back to yourself</Typography><Typography level="h1" className="aura-page-heading">{greeting}, {displayName}.</Typography></Box>
        <Typography level="body-sm" color="neutral" sx={{ whiteSpace: "nowrap" }}>{dayjs().format("dddd, MMMM D")}</Typography>
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }, gap: 1.5, mb: 3 }}>
        <MoodStatCard title="Total entries" value={`${totalEntries}`} />
        <MoodStatCard title="Most frequent mood" value={mostFrequent || "N/A"} emoji={mostFrequent ? MoodIcons[mostFrequent] : "·"} />
        <MoodStatCard title="Current streak" value={`${currentStreak} days`} emoji="✦" />
        <MoodStatCard title="Last entry" value={lastEntryDate} emoji="·" />
      </Box>
      <Grid container spacing={3}>
        <Grid xs={12} lg={8}>
          <Stack spacing={3}>
            <Sheet className="aura-panel" sx={{ p: { xs: 3, sm: 4 }, overflow: "hidden" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}><Typography className="aura-eyebrow" color="neutral">01 / Daily check-in</Typography><Typography level="body-xs" sx={{ px: 1.5, py: .75, borderRadius: 40, bgcolor: "var(--aura-wash)" }}>{todayEntry ? "A moment captured" : "A fresh page"}</Typography></Stack>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 160px" }, alignItems: "center", gap: 3, my: 3 }}>
                <Box>
                  <Typography level="h2" sx={{ fontSize: { xs: "2.8rem", sm: "3.8rem" }, fontWeight: 400, letterSpacing: "-.05em", lineHeight: 1 }}>Today</Typography>
                  <Typography level="body-lg" color="neutral" sx={{ mt: 1 }}>{todayEntry ? "This is where you are." : "What does your inner world feel like?"}</Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>{todayEntry?.moods.map(mood => <Box key={mood} sx={{ px: 1.5, py: .75, border: "1px solid var(--aura-line)", borderRadius: 40, bgcolor: "var(--aura-wash)" }}><Typography level="body-sm">{MoodIcons[mood]} {mood}</Typography></Box>)}</Stack>
                </Box>
                <Box aria-hidden="true" sx={{ display: { xs: "none", sm: "grid" }, placeItems: "center", p: 2 }}><Box className="aura-orb" sx={{ width: 120 }} /></Box>
              </Box>
              {todayEntry?.comment && <Box sx={{ p: 2.5, mb: 3, borderRadius: "md", bgcolor: "rgba(255,255,255,.45)", maxHeight: 180, overflowY: "auto" }}><MarkdownReflection value={todayEntry.comment} /></Box>}
              {!todayEntry && <Typography level="body-sm" color="neutral" sx={{ maxWidth: 390, mb: 3 }}>You don’t need the perfect words. Start with a color, a feeling, a little honesty.</Typography>}
              {entriesError && <Typography role="alert" level="body-sm" color="danger">Your entries couldn’t be loaded. <Button variant="plain" onClick={() => refetchEntries()}>Retry entries</Button></Typography>}
              <Stack direction="row" gap={1.5} flexWrap="wrap"><Button component={Link} href="/log-mood" variant="solid">Log your mood ↗</Button><Button component={Link} href="/history" variant="plain" color="neutral">Review history</Button></Stack>
            </Sheet>
            <Sheet className="aura-dark-panel" sx={{ p: { xs: 3, sm: 4 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography className="aura-eyebrow" sx={{ color: "inherit", opacity: .65 }}>Daily prompt</Typography><Typography sx={{ color: "inherit", fontSize: "1.6rem" }}>✧</Typography></Stack>
              <Typography level="h3" sx={{ color: "inherit", fontWeight: 400, fontSize: { xs: "1.8rem", sm: "2.4rem" }, lineHeight: 1.25, my: 2 }}>“{dailyQuote?.text ?? "What would you like to notice about today?"}”</Typography>
              <Typography level="body-xs" sx={{ color: "inherit", opacity: .65 }}>{dailyQuote?.theme} / {dailyQuote?.author ?? "Aura Logbook"} · {dailyQuotePathway?.title ?? "Mindful Pathway"}</Typography>
            </Sheet>
            <Sheet className="aura-panel" sx={{ p: { xs: 3, sm: 4 } }}>
              <Typography className="aura-eyebrow" color="neutral">02 / A little perspective</Typography><Typography level="h3" sx={{ mt: 1 }}>Your recent pattern</Typography><Typography level="body-sm" color="neutral" sx={{ mt: .5 }}>Mood over the last 7 days</Typography>
              <Box sx={{ mt: 3, overflowX: "auto" }}><MoodTimelineChart data={timeline || []} /></Box>
            </Sheet>
          </Stack>
        </Grid>
        <Grid xs={12} lg={4}>
          <Stack spacing={3}>
            <WeatherCard city="Atlanta" state="GA" country="US" />
            <SpotifyConnectionCard />
            {user?.selectedPathway && <Sheet className="aura-panel" sx={{ p: 3 }}><Typography className="aura-eyebrow" color="neutral">My pathway</Typography><Typography level="h3" sx={{ mt: 1 }}>{user.selectedPathway}</Typography><Typography level="body-sm" color="neutral" sx={{ mt: 1 }}>{SpiritualPathwayDescriptions[user.selectedPathway]}</Typography></Sheet>}
          </Stack>
        </Grid>
        <Grid xs={12}>
          <Sheet className="aura-panel" sx={{ p: { xs: 3, sm: 4 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}><Box><Typography className="aura-eyebrow" color="neutral">03 / The story so far</Typography><Typography level="h3" sx={{ mt: 1 }}>Recent reflections</Typography></Box><Button variant="plain" onClick={() => navigate("/history")}>View all →</Button></Stack>
            <Stack divider={<Divider />} sx={{ mt: 2 }}>
              {!recentEntries.length && <Typography level="body-sm" color="neutral" sx={{ py: 2 }}>Your reflections will appear here. Begin with a small note about what you noticed today.</Typography>}
              {recentEntries.slice(0, 3).map(entry => <Box key={entry.id} sx={{ py: 2 }}><Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={1}><Typography level="title-sm">{entry.moods.map(mood => `${MoodIcons[mood]} ${mood}`).join(" · ")}</Typography><Typography level="body-xs" color="neutral">{dayjs(entry.date).format("MMM D, YYYY")}</Typography></Stack>{entry.comment && <Box sx={{ mt: 1, maxHeight: 100, overflowY: "auto" }}><MarkdownReflection value={entry.comment} /></Box>}</Box>)}
              {zodiac && <Box sx={{ pt: 2 }}><Typography className="aura-eyebrow" color="neutral">A lens for reflection</Typography><Typography level="title-md" sx={{ mt: 1 }}>{zodiac.sign} • {zodiac.element}</Typography><Typography level="body-sm" color="neutral">{String(zodiac.description ?? "")}</Typography><Typography level="body-sm" color="neutral">{String(zodiac.insights?.[0]?.message ?? "")}</Typography></Box>}
            </Stack>
          </Sheet>
        </Grid>
        {breakdown && breakdown.length > 0 && <Grid xs={12}><Box className="aura-panel" sx={{ p: { xs: 2, sm: 3 } }}><MoodPieChart data={breakdown} /></Box></Grid>}
      </Grid>
    </Box>
  );
}
