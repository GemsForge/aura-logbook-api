import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import { MoodApi } from "../api/MoodApi";
import MoodStatCard from "../components/dashboard/MoodStatCard";

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

  useEffect(() => {
    (async () => {
      const result = await MoodApi.getDashboardSummary();
      setSummary(result);
    })();
  }, []);

  return (
    <Box maxWidth="md" mx="auto" mt={4}>
      <Typography variant="h5" gutterBottom>
        Welcome back, Gem!
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
            emoji="😄"
          />
        </Grid>
        <Grid>
          <MoodStatCard
            title="Current Streak"
            value={`${summary.currentStreak} days`}
            emoji="🔥"
          />
        </Grid>
        <Grid >
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
