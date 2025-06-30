import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  useGetCurrentUserQuery,
} from "@/store/authApi"; // ①
import { useGetZodiacInsightQuery } from "@/store/auraApi";
import { auraPalettes } from "@/theme/auraTheme";
import MoodStatCard from "../components/dashboard/MoodStatCard";
import MoodPieChart from "../components/dashboard/MoodPieChart";
import MoodTimelineChart from "../components/dashboard/MoodTimeLineChart";
import WeatherCard from "@/components/weather/WeatherCard";
import { getTimeGreeting } from "@/util/timeGreeting";
import { MoodIcons } from "@/features/mood/models/aura";
import { useGetDashboardSummaryQuery, useGetMoodBreakdownQuery, useGetMoodsByDateRangeQuery } from "@/store/moodApi";

export default function Dashboard() {
  const greeting = getTimeGreeting();

  // —— 1. RTK-Query hooks everywhere ——
  const { data: user, isLoading: loadingUser } = useGetCurrentUserQuery();
  const { data: summary, isLoading: loadingSummary } =
    useGetDashboardSummaryQuery();
  const { data: breakdown, isLoading: loadingBreakdown } =
    useGetMoodBreakdownQuery(false);
  const { data: timeline, isLoading: loadingTimeline } =
    useGetMoodsByDateRangeQuery("7d");
  const { data: zodiac, isLoading: loadingZodiac } = useGetZodiacInsightQuery();

  // —— 2. Aggregate loading state ——
  const loading =
    loadingUser ||
    loadingSummary ||
    loadingBreakdown ||
    loadingTimeline ||
    loadingZodiac;
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="300px">
        <CircularProgress size={48} />
      </Box>
    );
  }

  // —— 3. Derive values with safe fallbacks ——
  const auraColor = user?.auraColor ?? "blue";
  const displayName = user?.displayName ?? "Friend";
  const totalEntries = summary?.totalEntries ?? 0;
  const mostFrequent = summary?.mostFrequentMood ?? "";
  const currentStreak = summary?.currentStreak ?? 0;
  const lastEntryDate = summary?.lastEntryDate ?? "-";

  return (
    <Box maxWidth="md" mx="auto" mt={4}>
      {/* Greeting */}
      <Typography variant="h5" gutterBottom>
        {greeting}, {displayName}!
      </Typography>

      {/* Zodiac Insights */}
      {zodiac && (
        <Grid container spacing={2} mt={2}>
          <Grid sx={{ xs: 12 }}>
            <Card
              sx={{
                border: 2,
                borderColor: auraPalettes[auraColor].primary.main,
                borderRadius: 2,
              }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {zodiac.sign.toUpperCase()} • {zodiac.element}
                </Typography>
                <Typography variant="body2" mb={2}>
                  {zodiac.description}
                </Typography>
                <Divider />
                {zodiac.insights.map((ins, i) => (
                  <Typography key={i} variant="body2" mt={1}>
                    • {ins.message}
                  </Typography>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Mood Stat Cards */}
      <Grid container spacing={2} mt={4}>
        <Grid sx={{ xs: 12, sm: 6, md: 3 }}>
          <MoodStatCard
            title="Total Entries"
            value={`${totalEntries}`}
          />
        </Grid>
        <Grid sx={{ xs: 12, sm: 6, md: 3 }}>
          {" "}
          <MoodStatCard
            title="Most Frequent Mood"
            value={mostFrequent || "N/A"}
            emoji={mostFrequent ? MoodIcons[mostFrequent] : "❔"}
          />
        </Grid>
        <Grid sx={{ xs: 12, sm: 6, md: 3 }}>
          <MoodStatCard
            title="Current Streak"
            value={`${currentStreak} days`}
            emoji="🔥"
          />
        </Grid>
        <Grid sx={{ xs: 12, sm: 6, md: 3 }}>
          <MoodStatCard title="Last Entry" value={lastEntryDate} emoji="📅" />
        </Grid>
      </Grid>

      {/* Weather */}
      <Grid container spacing={2} mt={4}>
        <Grid sx={{ xs: 12, sm: 6, md: 3 }}>
          <WeatherCard city="Atlanta" state="GA" country="US" />
        </Grid>
      </Grid>

      {/* Charts */}
      <Box
        display="flex"
        justifyContent="center"
        gap={4}
        flexWrap="wrap"
        mt={4}>
        <MoodPieChart data={breakdown || []} />
        <MoodTimelineChart data={timeline || []} />
      </Box>
    </Box>
  );
}
