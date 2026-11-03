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

const moodOptions = [
  { label: "Calm", color: "#b8c2b0", icon: "☼" },
  { label: "Content", color: "#e9c99d", icon: "◡" },
  { label: "Energetic", color: "#e5ad85", icon: "✦" },
  { label: "Overwhelmed", color: "#d29d91", icon: "~" },
  { label: "Quiet", color: "#aeb0c2", icon: "·" },
];

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

/** Presents the persisted mood data in the Prism Garden dashboard composition. */
export default function Dashboard() {
  const navigate = useNavigate();
  const greeting = getTimeGreeting();
  const user = useAppSelector(selectCurrentUser);
  const today = dayjs().format("YYYY-MM-DD");
  const { isLoading: loadingUser } = useGetCurrentUserQuery();
  const { data: todayEntries, isLoading: loadingToday } = useGetAllMoodsQuery({ startDate: today, endDate: today });
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummaryQuery();
  const { data: breakdown, isLoading: loadingBreakdown } = useGetMoodBreakdownQuery(false);
  const { data: timeline, isLoading: loadingTimeline } = useGetMoodsByDateRangeQuery("7d");
  const { data: zodiac, isLoading: loadingZodiac } = useGetZodiacInsightQuery();

  const dailyQuotePathwayId = resolveDailyQuotePathwayId(user?.selectedPathway);
  const dailyQuotePathway = (dailyQuotes.pathways as DailyQuotePathway[]).find(({ id }) => id === dailyQuotePathwayId);
  const dailyQuoteIndex = Math.floor(dailyQuoteReloadSeed * (dailyQuotePathway?.quotes.length || 1));
  const dailyQuote = dailyQuotePathway?.quotes[dailyQuoteIndex];
  const todayEntry = todayEntries?.[todayEntries.length - 1];
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
    <Box sx={{ maxWidth: 1180, mx: "auto" }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "flex-end" }} gap={2} sx={{ mb: 3 }}>
        <Box>
          <Typography level="h1" sx={{ fontSize: { xs: "2.3rem", md: "3.2rem" }, letterSpacing: "-0.04em" }}>
            {greeting}, {displayName}.
          </Typography>
          <Typography level="body-sm" sx={{ mt: 0.75, letterSpacing: "0.24em", textTransform: "uppercase", color: "neutral.500" }}>
            A brighter day begins with a small pause.
          </Typography>
        </Box>
        <Typography level="body-sm" color="neutral">A moment for yourself</Typography>
      </Stack>

      <Grid container spacing={2}>
        <Grid xs={12}><SpotifyConnectionCard /></Grid>
        {user?.selectedPathway && <Grid xs={12}><Sheet variant="soft" color="neutral" sx={{ p: 2, borderRadius: "md" }}><Typography level="body-xs" sx={{ textTransform: "uppercase", letterSpacing: "0.16em" }}>My pathway</Typography><Typography level="title-md">{user.selectedPathway}</Typography><Typography level="body-sm" color="neutral">{SpiritualPathwayDescriptions[user.selectedPathway]}</Typography></Sheet></Grid>}
        <Grid xs={12} md={8}>
          <Sheet variant="outlined" sx={{ p: { xs: 2.5, md: 4 }, borderRadius: "lg", backgroundColor: "background.surface", boxShadow: "sm" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
              <Box>
                <Typography level="h2" sx={{ fontSize: "2rem" }}>Today</Typography>
                <Typography level="body-md" color="neutral">{todayEntry ? "Your logged mood today" : "How are you feeling?"}</Typography>
              </Box>
              <Typography level="body-sm" color="neutral">Take a breath.</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" gap={1} sx={{ mt: 3, overflowX: "auto", pb: 1 }}>
              {(todayEntry?.moods.length ? todayEntry.moods.map((mood) => ({ label: mood, color: "#b8c2b0", icon: MoodIcons[mood] ?? "·" })) : moodOptions).map((mood) => (
                <Stack key={mood.label} alignItems="center" gap={0.75} sx={{ minWidth: 70 }}>
                  <Box aria-hidden="true" sx={{ width: 48, height: 48, display: "grid", placeItems: "center", borderRadius: "50%", backgroundColor: mood.color, color: "#51463d", fontSize: "1.4rem" }}>{mood.icon}</Box>
                  <Typography level="body-xs" color="neutral">{mood.label}</Typography>
                </Stack>
              ))}
            </Stack>
            <Box sx={{ mt: 2.5, p: 2, minHeight: 92, border: "1px solid", borderColor: "neutral.200", borderRadius: "md", backgroundColor: "rgba(255,255,255,.42)" }}>
              {todayEntry?.comment ? <MarkdownReflection value={todayEntry.comment} /> : <Typography level="body-sm" color="neutral">What’s on your mind today?</Typography>}
            </Box>
            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
              <Stack direction="row" gap={1} alignItems="center">
                <Button component={Link} href="/history" variant="plain" color="neutral">Review history</Button>
                <Button component={Link} href="/log-mood" variant="solid" color="primary">Log your mood</Button>
              </Stack>
            </Stack>
          </Sheet>
        </Grid>
        <Grid xs={12} md={4}>
          <WeatherCard city="Atlanta" state="GA" country="US" />
        </Grid>
        <Grid xs={12} md={7}>
          <Sheet variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: "lg", backgroundColor: "background.surface", boxShadow: "sm", height: "100%" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline"><Box><Typography level="h3">Your recent pattern</Typography><Typography level="body-sm" color="neutral">Mood over the last 7 days</Typography></Box><Typography level="body-xs" color="neutral">Last 7 days</Typography></Stack>
            <Box sx={{ mt: 2, overflowX: "auto" }}><MoodTimelineChart data={timeline || []} /></Box>
          </Sheet>
        </Grid>
        <Grid xs={12} md={5}>
          <Sheet variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: "lg", backgroundColor: "#e4d8c9", height: "100%", display: "flex", alignItems: "center" }}>
            <Box>
              <Typography level="body-xs" sx={{ textTransform: "uppercase", letterSpacing: "0.16em" }}>Daily prompt</Typography>
              <Typography level="h3" sx={{ mt: 1 }}>{dailyQuote?.theme ?? "A quiet moment"}</Typography>
              <Divider sx={{ my: 2, width: 50 }} />
              <Typography level="body-md" sx={{ fontFamily: "display", fontStyle: "italic" }}>
                “{dailyQuote?.text ?? "What would you like to notice about today?"}”
              </Typography>
              <Typography level="body-xs" color="neutral" sx={{ mt: 1.5 }}>{dailyQuote?.author ?? "Aura Logbook"} · {dailyQuotePathway?.title ?? "Mindful Pathway"}</Typography>
            </Box>
          </Sheet>
        </Grid>
        <Grid xs={12}>
          <Sheet variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: "lg", backgroundColor: "background.surface", boxShadow: "sm" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline"><Typography level="h3">Recent reflections</Typography><Button variant="plain" onClick={() => navigate("/history")}>View all →</Button></Stack>
            <Stack divider={<Divider />} sx={{ mt: 1.5 }}>
              <Stack direction="row" gap={2} alignItems="center" sx={{ py: 1.5 }}><Box sx={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: "#b8c2b0" }} /><Box><Typography level="title-md">Your reflections will appear here</Typography><Typography level="body-sm" color="neutral">Begin with a small note about what you noticed today.</Typography></Box></Stack>
              {zodiac && <Stack direction="row" gap={2} alignItems="center" sx={{ py: 1.5 }}><Box sx={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: "#a886a4" }} /><Box><Typography level="title-md">{zodiac.sign} • {zodiac.element}</Typography><Typography level="body-sm" color="neutral">{String(zodiac.description ?? "A possibility to explore, if it resonates.")}</Typography><Typography level="body-sm" color="neutral">{String(zodiac.insights?.[0]?.message ?? "Take your time and trust your rhythm.")}</Typography></Box></Stack>}
            </Stack>
          </Sheet>
        </Grid>
        <Grid xs={12}>
          <Stack direction="row" flexWrap="wrap" gap={1.5}>
            <MoodStatCard title="Total entries" value={`${totalEntries}`} />
            <MoodStatCard title="Most frequent mood" value={mostFrequent || "N/A"} emoji={mostFrequent ? MoodIcons[mostFrequent] : "·"} />
            <MoodStatCard title="Current streak" value={`${currentStreak} days`} emoji="✦" />
            <MoodStatCard title="Last entry" value={lastEntryDate} emoji="·" />
          </Stack>
        </Grid>
        {breakdown && breakdown.length > 0 && <Grid xs={12}><MoodPieChart data={breakdown} /></Grid>}
      </Grid>
    </Box>
  );
}
