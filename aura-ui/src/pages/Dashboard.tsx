import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import { useGetZodiacInsightQuery } from "../store/auraApi";
import { auraPalettes } from "../theme/auraTheme";
import { MoodApi } from "../api/MoodApi";
import { AuthApi } from "../api/AuthApi";
import { MoodIcons } from "../features/mood/models/aura/MoodIcons";
import type { MoodType } from "../features/mood/models/schema/MoodType";
import type { MoodFrequencyResponse } from "../features/mood/models/schema/MoodAuth";
import MoodStatCard from "../components/dashboard/MoodStatCard";
import MoodPieChart from "../components/dashboard/MoodPieChart";
import type { MoodByDate } from "../components/dashboard/MoodTimeLineChart";
import MoodTimelineChart from "../components/dashboard/MoodTimeLineChart";
import { useToast } from "../hooks/useToast";
import WeatherCard from "@/components/weather/WeatherCard";
import { getTimeGreeting } from "@/util/timeGreeting";
import { selectAuraColor } from "@/store/slices/authSlice";

function Dashboard() {
  const { showToast } = useToast();
  const greeting = getTimeGreeting();

  // Get current user aura color from auth slice
  const auraColor = useSelector(selectAuraColor);

  // Zodiac insights via RTK Query
  const { data: zodiac } = useGetZodiacInsightQuery();

  const [summary, setSummary] = useState<{
    totalEntries: number;
    mostFrequentMood: string | null;
    currentStreak: number;
    lastEntryDate: string | null;
  }>({
    totalEntries: 0,
    mostFrequentMood: "",
    currentStreak: 0,
    lastEntryDate: null,
  });
  const [displayName, setDisplayName] = useState<string>("");
  const [moodBreakdown, setMoodBreakdown] = useState<MoodFrequencyResponse[]>(
    []
  );
  const [moodByDate, setMoodByDate] = useState<MoodByDate[]>([]);

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

      {/* Zodiac Insights Card */}
      {zodiac && (
        <Grid container spacing={2} mt={2}>
          <Grid sx={{ xs: 12 }}>
            <Card
              sx={{
                borderWidth: 2,
                borderStyle: "solid",
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
                {zodiac.insights.map((ins, idx) => (
                  <Typography key={idx} variant="body2" mt={1}>
                    • {ins.message ?? JSON.stringify(ins)}
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
        <Grid sx={{ xs:12, sm:6, md:3}}>
          <MoodStatCard
            title="Current Streak"
            value={`${summary.currentStreak} days`}
            emoji="🔥"
          />
        </Grid>
        <Grid sx={{ xs:12, sm:6, md:3}}>
          <MoodStatCard
            title="Last Entry"
            value={summary.lastEntryDate ?? "-"}
            emoji="📅"
          />
        </Grid>
      </Grid>

      {/* Weather Card */}
      <Grid container spacing={2} mt={4}>
        <Grid sx={{ xs:12, sm:6, md:3}}>
          <WeatherCard city="Atlanta" state="GA" country="US" />
        </Grid>
      </Grid>

      {/* Mood Charts */}
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
