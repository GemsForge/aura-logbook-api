import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import { MoodApi } from "../api/MoodApi";
import MoodStatCard from "../components/dashboard/MoodStatCard";
import { AuthApi } from "../api/AuthApi";
import { MoodIcons } from "../features/mood/models/aura/MoodIcons";
import type { MoodType } from "../features/mood/models/schema/MoodType";
import type { MoodFrequencyResponse } from "../features/mood/models/schema/MoodAuth";
import MoodPieChart from "../components/dashboard/MoodPieChart";
import type { MoodByDate } from "../components/dashboard/MoodTimeLineChart";
import MoodTimelineChart from "../components/dashboard/MoodTimeLineChart";
import { useToast } from "../hooks/useToast";
import WeatherCard from "@/components/weather/WeatherCard";
import { getTimeGreeting } from "@/util/timeGreeting";

function Dashboard() {
  const { showToast } = useToast();
  const [summary, setSummary] = useState<{
    totalEntries: number;
    mostFrequentMood: string | null;
    currentStreak: number;
    lastEntryDate: string | null;
  }>({
    totalEntries: 0,
    mostFrequentMood: "",
    currentStreak: 0,
    lastEntryDate: "",
  });
  const [displayName, setDisplayName] = useState<string>("");
  const [moodBreakdown, setMoodBreakdown] = useState<MoodFrequencyResponse[]>(
    []
  );
  const [moodByDate, setMoodByDate] = useState<MoodByDate[]>([]);
  const greeting = getTimeGreeting();

  useEffect(() => {
    (async () => {
      try {
        const raw = await MoodApi.getMoodsByDateRange();
        const parsed = Object.entries(raw).map(([date, count]) => ({
          date,
          count,
        }));
        setMoodByDate(parsed);
      } catch (error: any) {
        showToast("Failed to load mood timeline", "error");
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [result, profile, data] = await Promise.all([
          MoodApi.getDashboardSummary(),
          AuthApi.getCurrentUser(),
          MoodApi.getMoodBreakdown(true),
        ]);
        setSummary(result);
        setDisplayName(profile.displayName);
        setMoodBreakdown(data);
      } catch (error: any) {
        showToast("Error loading dashboard data", "error");
      }
    })();
  }, []);

  return (
    <Box maxWidth="md" mx="auto" mt={4}>
      <Typography variant="h5" gutterBottom>
        {greeting}, {displayName || "Friend"}!
      </Typography>

      <Grid container spacing={2} mt={2}>
        <Grid sx={{ xs: 12, sm: 6, md: 3 }}>
          <MoodStatCard
            title="Total Entries"
            value={`${summary.totalEntries}`}
          />
        </Grid>
        <Grid sx={{ xs: 12, sm: 6, md: 3 }}>
          <MoodStatCard
            title="Most Frequent Mood"
            value={summary.mostFrequentMood ?? "N/A"}
            emoji={
              summary.mostFrequentMood
                ? MoodIcons[summary.mostFrequentMood as MoodType]
                : "❔"
            }
          />
        </Grid>
        <Grid sx={{ xs: 12, sm: 6, md: 3 }}>
          <MoodStatCard
            title="Current Streak"
            value={`${summary.currentStreak} days`}
            emoji="🔥"
          />
        </Grid>
        <Grid sx={{ xs: 12, sm: 6, md: 3 }}>
          <MoodStatCard
            title="Last Entry"
            value={summary.lastEntryDate ?? "-"}
            emoji="📅"
          />
        </Grid>
      </Grid>

      {/** --------- Weather ------- */}
      <Grid container spacing={2} mt={4}>
        <Grid sx={{ xs: 12, sm: 6, md: 3 }}>
          <WeatherCard city="Atlanta" state="GA" country="US" />
        </Grid>
      </Grid>
      <Box
        display="flex"
        justifyContent="center"
        gap={4}
        flexWrap="wrap"
        mt={4}>
        <MoodPieChart data={moodBreakdown} />
        <MoodTimelineChart data={moodByDate} />
      </Box>
    </Box>
  );
}
export default Dashboard;
