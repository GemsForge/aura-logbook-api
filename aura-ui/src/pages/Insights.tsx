import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import MoodPieChart from "@/components/dashboard/MoodPieChart";
import { summarizeMoodPatterns } from "@/features/mood/moodPatternSummary";
import { useGetZodiacInsightQuery } from "@/store/auraApi";
import { useGetAllMoodsQuery, useGetMoodBreakdownQuery } from "@/store/moodApi";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { useAppSelector } from "@/store/hooks";

/**
 * Insights destination: the weekly pattern summary, the all-time mood breakdown, and (on the
 * Astrology & Energy pathway only) the celestial lens. Moved off Today so Today stays a quick
 * check-in screen and the pattern summary is not shown twice.
 */
export default function Insights() {
  const user = useAppSelector(selectCurrentUser);
  const { data: entries = [], isLoading: loadingEntries } = useGetAllMoodsQuery();
  const { data: breakdown, isLoading: loadingBreakdown } = useGetMoodBreakdownQuery(false);
  // Celestial data is neither requested nor rendered on shared/default pathways.
  const showAstrologyContent = user?.selectedPathway === "Energy";
  const { data: zodiac } = useGetZodiacInsightQuery(undefined, { skip: !showAstrologyContent });
  const loading = loadingEntries || loadingBreakdown;

  return (
    <Box sx={{ maxWidth: 1240, mx: "auto" }}>
      <Typography level="h1" sx={{ fontSize: { xs: "1.7rem", sm: "1.9rem" }, fontWeight: 450, mb: 2 }}>Insights</Typography>
      <Stack gap={2}>
        <Sheet className="aura-panel" sx={{ p: 2 }}>
          <Typography level="h2" sx={{ fontSize: "1.1rem" }}>Your patterns</Typography>
          <Typography level="body-sm" color="neutral" sx={{ mt: .5 }}>
            {loading ? "Loading your patterns…" : entries.length ? summarizeMoodPatterns(entries) : "Patterns will appear here after a few check-ins."}
          </Typography>
        </Sheet>
        {breakdown && breakdown.length > 0 && (
          <Sheet className="aura-panel" sx={{ p: 2 }}>
            <Typography level="h2" sx={{ fontSize: "1.1rem" }}>Mood breakdown</Typography>
            <Box sx={{ mt: 2 }}><MoodPieChart data={breakdown} /></Box>
          </Sheet>
        )}
        {showAstrologyContent && zodiac && (
          <Sheet className="aura-panel" sx={{ p: 2 }}>
            <Typography level="h2" sx={{ fontSize: "1.1rem" }}>{zodiac.sign} • {zodiac.element}</Typography>
            <Typography level="body-sm" color="neutral">{String(zodiac.description ?? "")}</Typography>
            <Typography level="body-sm" color="neutral">{String(zodiac.insights?.[0]?.message ?? "")}</Typography>
          </Sheet>
        )}
      </Stack>
    </Box>
  );
}
