import WeatherCard from "@/components/weather/WeatherCard";
import { SpiritualPathwayDescriptions } from "@/features/auth/models/SpiritualPathway";
import { MoodIcons } from "@/features/mood/models/aura";
import { useGetZodiacInsightQuery } from "@/store/auraApi";
import { useGetCurrentUserQuery } from "@/store/authApi"; // ①
import { useAppSelector } from "@/store/hooks";
import { useGetDashboardSummaryQuery, useGetMoodBreakdownQuery, useGetMoodsByDateRangeQuery } from "@/store/moodApi";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { auraPalettes } from "@/theme/auraTheme";
import { getTimeGreeting } from "@/util/timeGreeting";
import {
  Button,
  Box,
  CircularProgress,
  Divider,
  Grid,
  Typography,
} from "@mui/material";
import Sheet from "@mui/joy/Sheet";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import MoodPieChart from "../components/dashboard/MoodPieChart";
import MoodStatCard from "../components/dashboard/MoodStatCard";
import MoodTimelineChart from "../components/dashboard/MoodTimeLineChart";

export default function Dashboard() {
  const greeting = getTimeGreeting();
  const user = useAppSelector(selectCurrentUser);

  // —— 1. RTK-Query hooks everywhere ——
  const { isLoading: loadingUser } = useGetCurrentUserQuery();
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
  const selectedPathway = user?.selectedPathway;
  const totalEntries = summary?.totalEntries ?? 0;
  const mostFrequent = summary?.mostFrequentMood ?? "";
  const currentStreak = summary?.currentStreak ?? 0;
  const parsedLastEntryDate = summary?.lastEntryDate
    ? dayjs(summary.lastEntryDate)
    : null;
  const lastEntryDate = parsedLastEntryDate?.isValid()
    ? parsedLastEntryDate.format("MMMM D, YYYY")
    : "No entries yet";

  return (
    <Box maxWidth="xl" mx="auto" mt={{ xs: 1, md: 3 }} mb={6}>
      <Sheet
        variant="soft"
        sx={{
          p: { xs: 2.5, md: 4 },
          mb: 3,
          borderRadius: "24px",
          background: `linear-gradient(135deg, ${auraPalettes[auraColor][100].main} 0%, rgba(255,255,255,.92) 72%)`,
          border: "1px solid",
          borderColor: auraPalettes[auraColor][300].main,
        }}>
        <Typography variant="overline" color="text.secondary">
          Your daily reflection space
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 700, letterSpacing: "-.03em" }}>
          {greeting}, {displayName}.
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 620, mt: 1 }}>
          Notice what is present, then choose one small step that supports your
          day. Your dashboard keeps the signal close and the noise low.
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mt: 3 }}>
          <Button component={Link} to="/log-mood" variant="contained">
            Log your mood
          </Button>
          <Button component={Link} to="/history" variant="outlined">
            Review history
          </Button>
        </Box>
      </Sheet>

      {selectedPathway && (
        <Sheet variant="outlined" sx={{ mb: 3, p: 2.5, borderRadius: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">
              My Pathway
            </Typography>
            <Typography variant="h6">{selectedPathway}</Typography>
            <Typography variant="body2" color="text.secondary">
              {SpiritualPathwayDescriptions[selectedPathway]}
            </Typography>
        </Sheet>
      )}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: zodiac ? 7 : 12 }}>
          <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 650 }}>
            Your recent pattern
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <MoodStatCard title="Total entries" value={`${totalEntries}`} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <MoodStatCard
                title="Most frequent mood"
                value={mostFrequent || "No mood yet"}
                emoji={mostFrequent ? MoodIcons[mostFrequent] : "❔"}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <MoodStatCard title="Current streak" value={`${currentStreak} days`} emoji="🔥" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <MoodStatCard title="Last entry" value={lastEntryDate} emoji="📅" />
            </Grid>
          </Grid>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 2 }}>
            <MoodPieChart data={breakdown || []} />
            <MoodTimelineChart data={timeline || []} />
          </Box>
        </Grid>

        {zodiac && (
          <Grid size={{ xs: 12, md: 5 }}>
            <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 650 }}>
              A moment to reflect
            </Typography>
            <Sheet
              variant="outlined"
              sx={{
                height: "calc(100% - 44px)",
                border: 2,
                borderColor: auraPalettes[auraColor].primary.main,
                borderRadius: 3,
                background: "rgba(255,255,255,.72)",
              }}>
              <Box sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" gutterBottom>
                  {zodiac.sign.toUpperCase()} • {zodiac.element}
                </Typography>
                <Typography variant="body2" mb={2}>
                  {zodiac.description}
                </Typography>
                <Divider />
                {zodiac.insights.map((ins, i) => (
                  <Typography key={i} variant="body2" mt={1}>
                    • {String(ins.message ?? "")}
                  </Typography>
                ))}
              </Box>
            </Sheet>
          </Grid>
        )}
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 650 }}>
          Around you
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <WeatherCard city="Atlanta" state="GA" country="US" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Sheet variant="outlined" sx={{ p: 2.5, height: "100%", borderRadius: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                A gentle prompt
              </Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>
                What would make today feel a little more supported?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Your answer can be simple. The logbook is here to help you notice,
                not to judge.
              </Typography>
            </Sheet>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
