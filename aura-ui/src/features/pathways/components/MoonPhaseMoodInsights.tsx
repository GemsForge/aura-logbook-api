import { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/joy";
import { InsightFeedback } from "./InsightFeedback";
import { PathwayReflectionPrompt } from "./PathwayReflectionPrompt";
import { getMoonPhaseMoodInsights, type MoonPhaseMoodInsights as MoonInsights } from "../astrologyApi";

/**
 * Shows descriptive co-occurrence counts for a recent local-date window.
 * This view presents no causal claim about lunar phases and moods.
 */
export function MoonPhaseMoodInsights() {
  const [data, setData] = useState<MoonInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const endDate = localDate(new Date());
  const start = new Date();
  start.setDate(start.getDate() - 29);
  const startDate = localDate(start);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void getMoonPhaseMoodInsights(startDate, endDate)
      .then((result) => { if (active) setData(result); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [startDate, endDate]);

  return <Box component="section" sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid var(--al-theme-border)" }}>
    <Typography level="title-sm">Moods across moon phases</Typography>
    <Typography level="body-xs" color="neutral" sx={{ mt: .25 }}>Your entries by phase · last 30 days</Typography>
    {loading ? <Box role="status" sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}><CircularProgress size="sm" /><Typography level="body-xs">Loading phase counts…</Typography></Box>
      : error ? <Typography role="status" level="body-sm" sx={{ mt: 1 }}>Moon phase counts are unavailable right now.</Typography>
        : data?.moodEntryCount === 0 ? <Typography level="body-sm" sx={{ mt: 1 }}>Log a mood to begin noticing patterns.</Typography>
          : data && data.phases.length > 0 ? <>
            <Box component="ul" aria-label="Mood entry counts by moon phase" sx={{ listStyle: "none", p: 0, m: "8px 0 0", display: "grid", gap: .5 }}>
              {data.phases.map((item) => <Box component="li" key={item.phase} sx={{ display: "grid", gridTemplateColumns: "minmax(110px, 1fr) auto", gap: 1, alignItems: "baseline", py: .5, borderBottom: "1px solid var(--al-theme-border)" }}>
                <Typography level="body-sm">{item.phase}</Typography>
                <Typography level="body-xs" color="neutral">{item.entryCount} {item.entryCount === 1 ? "entry" : "entries"}</Typography>
                <Typography level="body-xs" color="neutral" sx={{ gridColumn: "1 / -1" }}>{Object.entries(item.moodCounts).slice(0, 4).map(([key, count]) => `${formatMood(key)} ${count}`).join(" · ")}</Typography>
              </Box>)}
            </Box>
            <InsightFeedback pathway="energy" moduleKey="daily-astrology" insightType="moon-phase" hideContentWhenNotForMe>
              <>
                <Typography level="body-sm" sx={{ mt: 1.25 }}>Seeing these counts together, does any pattern feel meaningful to you?</Typography>
                <PathwayReflectionPrompt pathway="energy" moduleKey="daily-astrology" insightType="moon-phase" prompt="What, if anything, do these counts bring up for you?" />
                {data.datesWithoutPhaseData > 0 && <Typography level="body-xs" color="neutral" sx={{ mt: .5 }}>Phase data was unavailable for {data.datesWithoutPhaseData} {data.datesWithoutPhaseData === 1 ? "date" : "dates"}.</Typography>}
              </>
            </InsightFeedback>
          </>
            : <Typography role="status" level="body-sm" sx={{ mt: 1 }}>No phase counts are available for this period.</Typography>}
  </Box>;
}

/** Formats database mood keys into readable labels without inventing a mood mapping. */
function formatMood(key: string) {
  return key.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** Formats a local calendar date without shifting it through UTC. */
function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
