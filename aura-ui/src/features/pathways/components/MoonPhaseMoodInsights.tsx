import { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/joy";
import { InsightFeedback } from "./InsightFeedback";
import { PathwayReflectionPrompt } from "./PathwayReflectionPrompt";
import { getMoonPhaseMoodInsights, type MoonPhaseMoodInsights as MoonInsights } from "../astrologyApi";
import { MoonPhaseDisc } from "./MoonPhaseDisc";

/**
 * Lets the user explore descriptive lunar co-occurrence counts in the recent local-date window.
 * This view presents no causal claim about lunar phases and moods.
 */
export function MoonPhaseMoodInsights() {
  const [data, setData] = useState<MoonInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const endDate = localDate(new Date());
  const start = new Date();
  start.setDate(start.getDate() - 29);
  const startDate = localDate(start);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    void getMoonPhaseMoodInsights(startDate, endDate)
      .then((result) => { if (active) setData(result); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [startDate, endDate]);

  const selected = data?.phases.find((phase) => phase.phase === selectedPhase) ?? data?.phases[0];
  const moods = Object.entries(selected?.moodCounts ?? {}).sort((a, b) => b[1] - a[1]);
  const largestMoodCount = Math.max(1, ...moods.map(([, count]) => count));

  return <Box component="section" aria-labelledby="moon-moods-title" sx={{ minWidth: 0 }}>
    <Typography id="moon-moods-title" component="h2" level="title-lg">Moods across moon phases</Typography>
    <Typography level="body-sm" color="neutral" sx={{ mt: .5 }}>Your entries by phase · last 30 days</Typography>
    {loading ? <Box role="status" sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}><CircularProgress size="sm" /><Typography level="body-xs">Loading phase counts…</Typography></Box>
      : error ? <Typography role="status" level="body-sm" sx={{ mt: 1 }}>Moon phase counts are unavailable right now.</Typography>
        : data?.moodEntryCount === 0 ? <Typography level="body-sm" sx={{ mt: 1 }}>Log a mood to begin noticing patterns.</Typography>
          : data && data.phases.length > 0 ? <>
            <Box component="ul" aria-label="Mood entry counts by moon phase" sx={{ listStyle: "none", p: 0, m: 0, mt: 2, display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, minmax(0, 1fr))" }, gap: 1 }}>
              {data.phases.map((item) => <Box component="li" key={item.phase} sx={{ minWidth: 0 }}>
                <Button variant={selected?.phase === item.phase ? "soft" : "plain"} color="neutral" aria-pressed={selected?.phase === item.phase} onClick={() => setSelectedPhase(item.phase)} sx={{ width: "100%", minHeight: 140, p: 1, display: "flex", flexDirection: "column", gap: .75, borderRadius: "sm", color: "var(--al-theme-ink)", bgcolor: selected?.phase === item.phase ? "var(--al-theme-surface)" : undefined, boxShadow: selected?.phase === item.phase ? "inset 0 -2px 0 var(--al-theme-ink)" : undefined }}>
                  <MoonPhaseDisc phase={item.phase} />
                  <Typography component="span" level="title-sm" sx={{ color: "inherit", whiteSpace: "normal", overflowWrap: "anywhere" }}>{item.phase}</Typography>
                  <Typography component="span" level="body-xs" sx={{ color: "inherit" }}>{item.entryCount} {item.entryCount === 1 ? "entry" : "entries"}</Typography>
                </Button>
              </Box>)}
            </Box>
            {selected && <Box component="section" aria-labelledby="selected-phase-title" sx={{ mt: 2.5, minWidth: 0 }}>
              <Typography id="selected-phase-title" component="h3" level="title-sm">Recorded with {selected.phase.toLowerCase()}</Typography>
              <Box component="ul" aria-label={`Mood counts during ${selected.phase}`} sx={{ listStyle: "none", p: 0, m: 0, mt: 1, display: "grid", gap: 1 }}>
                {moods.map(([key, count]) => <Box component="li" key={key} sx={{ minWidth: 0, display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", columnGap: 1, rowGap: .5 }}>
                  <Typography level="body-sm" sx={{ overflowWrap: "anywhere" }}>{formatMood(key)}</Typography>
                  <Typography level="body-sm">{count}</Typography>
                  <Box aria-hidden="true" sx={{ gridColumn: "1 / -1", height: 6, bgcolor: "var(--al-theme-surface)", borderRadius: "xs", overflow: "hidden" }}><Box sx={{ width: `${count / largestMoodCount * 100}%`, height: "100%", bgcolor: "var(--al-theme-ink)", opacity: .65 }} /></Box>
                </Box>)}
              </Box>
              {moods.length === 0 && <Typography level="body-sm" sx={{ mt: 1 }}>No individual mood counts were returned for this phase.</Typography>}
            </Box>}
            <InsightFeedback pathway="energy" moduleKey="daily-astrology" insightType="moon-phase" hideContentWhenNotForMe>
              <>
                <Typography level="body-sm" sx={{ mt: 1.25 }}>Seeing these counts together, does any pattern feel meaningful to you?</Typography>
                <PathwayReflectionPrompt pathway="energy" moduleKey="daily-astrology" insightType="moon-phase" prompt="What, if anything, do these counts bring up for you?" />
              </>
            </InsightFeedback>
          </>
            : <Typography role="status" level="body-sm" sx={{ mt: 1 }}>No phase counts are available for this period.</Typography>}
    {!loading && !error && data && data.moodEntryCount > 0 && <Box sx={{ mt: 2 }}>
      <Typography level="body-xs" color="neutral">{data.entriesWithPhaseData} of {data.moodEntryCount} entries have phase data. These are recorded counts, not evidence that the moon caused a mood.</Typography>
      {data.datesWithoutPhaseData > 0 && <Typography level="body-xs" color="neutral" sx={{ mt: .5 }}>Phase data was unavailable for {data.datesWithoutPhaseData} {data.datesWithoutPhaseData === 1 ? "date" : "dates"}.</Typography>}
    </Box>}
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
