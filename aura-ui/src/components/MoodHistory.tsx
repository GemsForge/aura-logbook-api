import { useEffect, useState } from "react";
import { MoodApi } from "../api/MoodApi";

import { MoodCard } from "../components/MoodCard";
import { Box, Typography } from "@mui/material";
import type { MoodEntry } from "../features/mood/models/MoodEntry";

export default function MoodHistoryPage() {
  const [logs, setLogs] = useState<MoodEntry[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const response = await MoodApi.getAllMoods(); // implement this
        setLogs(response);
      } catch (err) {
        console.error("Failed to fetch moods", err);
      }
    })();
  }, []);
//TODO: Add filtering by tags and date
  return (
    <Box maxWidth={600} mx="auto" mt={4}>
      <Typography variant="h5" gutterBottom>
        Mood History
      </Typography>

      {logs.length === 0 ? (
        <Typography>No entries found.</Typography>
      ) : (
        logs.map((entry) => <MoodCard key={entry.id} entry={entry} />)
      )}
    </Box>
  );
}
