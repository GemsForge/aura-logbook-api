import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import { MoodApi } from "../api/MoodApi";
import MoodStatCard from "../components/dashboard/MoodStatCard";
import { AuthApi } from "../api/AuthApi";
import { MoodIcons } from "../features/mood/models/MoodIcons";
import type { MoodType } from "../features/mood/models/MoodType";

function Dashboard () {
  const [summary, setSummary] = useState<{
    totalEntries: number;
    mostFrequentMood: string | null;
    currentStreak: number;
    lastEntryDate: string | null;
  }>({
    totalEntries: 0,
    mostFrequentMood: '',
    currentStreak: 0,
    lastEntryDate:'',
  });
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    (async () => {
      const result = await MoodApi.getDashboardSummary();
      const profile = await AuthApi.getCurrentUser();
      setDisplayName(profile.displayName);
      setSummary(result);
    })();
  }, []);

  return (
    <Box maxWidth="md" mx="auto" mt={4}>
      <Typography variant="h5" gutterBottom>
        Welcome back, {displayName || "Friend"}!
      </Typography>

      <Grid container spacing={2} mt={2}>
        <Grid>
          <MoodStatCard
            title="Total Entries"
            value={`${summary.totalEntries}`}
          />
        </Grid>
        <Grid>
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
        <Grid>
          <MoodStatCard
            title="Current Streak"
            value={`${summary.currentStreak} days`}
            emoji="🔥"
          />
        </Grid>
        <Grid>
          <MoodStatCard
            title="Last Entry"
            value={summary.lastEntryDate ?? "-"}
            emoji="📅"
          />
        </Grid>
      </Grid>
    </Box>
  );
}
export default Dashboard;
