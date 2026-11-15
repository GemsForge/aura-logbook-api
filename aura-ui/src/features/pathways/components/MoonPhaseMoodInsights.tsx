import { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/joy";
import { InsightFeedback } from "./InsightFeedback";
import { PathwayReflectionPrompt } from "./PathwayReflectionPrompt";
import { getMoonPhaseMoodInsights, type MoonPhaseMoodInsights as MoonInsights } from "../astrologyApi";
import { MoonPhaseDisc } from "./MoonPhaseDisc";
import { PathwaySteps, StepHeading } from "./PathwaySteps";

/**
 * Lets the user explore descriptive lunar co-occurrence counts in the recent local-date window.
 * This view presents no causal claim about lunar phases and moods.
 */
export function MoonPhaseMoodInsights() {
  const [data, setData] = useState<MoonInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  // Picking a phase advances to its mood counts; every step stays reachable from the path.
  const [step, setStep] = useState(0);
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
  }, [startDate, endDate, attempt]);

  const selected = data?.phases.find((phase) => phase.phase === selectedPhase) ?? data?.phases[0];
  const moods = Object.entries(selected?.moodCounts ?? {}).sort((a, b) => b[1] - a[1]);
  const largestMoodCount = Math.max(1, ...moods.map(([, count]) => count));

  return <Box component="section" aria-labelledby="moon-moods-title" sx={{ minWidth: 0 }}>
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography id="moon-moods-title" component="h2" level="title-lg">Moods across moon phases</Typography>
        <Typography level="body-xs" color="neutral" sx={{ mt: .5 }}>Your last 30 days, in three short steps.</Typography>
      </Box>
      <Box component="img" src="/theme-assets/pathways/astrology-energy/astrology-energy-moon-phases.png" alt="" sx={{ width: { xs: 88, sm: 120 }, maxWidth: "30%", height: 56, objectFit: "contain", flexShrink: 0 }} />
    </Box>
    {loading ? <Box role="status" sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}><CircularProgress size="sm" /><Typography level="body-xs">Loading phase counts…</Typography></Box>
      : error ? <Box sx={{ mt: 1 }}><Typography role="status" level="body-sm">Moon phase counts are unavailable right now.</Typography><Button size="sm" variant="plain" onClick={() => setAttempt((value) => value + 1)} sx={{ minHeight: 44 }}>Try again</Button></Box>
        : data?.moodEntryCount === 0 ? <Box sx={{ mt: 1 }}><Typography level="body-sm">Log a mood to begin noticing patterns.</Typography><Button component="a" href="/log-mood" size="sm" variant="plain" sx={{ minHeight: 44 }}>Log a mood</Button></Box>
          : data && data.phases.length > 0 ? <Box sx={{ mt: 2 }}><PathwaySteps label="Moon phase steps" current={step} onStepChange={setStep} steps={[
            { title: "Pick a phase", summary: selected?.phase, content: <>
              <StepHeading>Which phase?</StepHeading>
              <Typography level="body-sm" color="neutral" sx={{ mt: 1 }}>Each shows how many moods you logged under it.</Typography>
              <Box component="ul" aria-label="Mood entry counts by moon phase" sx={{ listStyle: "none", p: 0, m: 0, mt: 2, display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: .5 }}>
                {data.phases.map((item) => <Box component="li" key={item.phase} sx={{ minWidth: 0 }}>
                  <Button variant={selected?.phase === item.phase ? "soft" : "plain"} color="neutral" aria-pressed={selected?.phase === item.phase} onClick={() => { setSelectedPhase(item.phase); setStep(1); }} sx={{ width: "100%", minWidth: 0, minHeight: 100, p: .5, display: "flex", flexDirection: "column", gap: .5, borderRadius: "xs", color: "var(--al-theme-ink)", bgcolor: selected?.phase === item.phase ? "var(--al-theme-surface)" : undefined, boxShadow: selected?.phase === item.phase ? "inset 0 -2px 0 var(--al-theme-ink)" : undefined }}>
                    <MoonPhaseDisc phase={item.phase} size={36} />
                    <Typography component="span" level="body-xs" sx={{ color: "inherit", whiteSpace: "normal", overflowWrap: "anywhere", textAlign: "center" }}>{item.phase}</Typography>
                    <Typography component="span" level="body-xs" sx={{ color: "inherit" }}>{item.entryCount} {item.entryCount === 1 ? "entry" : "entries"}</Typography>
                  </Button>
                </Box>)}
              </Box>
            </> },
            { title: "See moods", content: selected && <Box component="section" aria-labelledby="selected-phase-title" sx={{ minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: .5 }}>
                <MoonPhaseDisc phase={selected.phase} size={44} />
                <Typography id="selected-phase-title" component="h3" sx={{ fontFamily: "var(--joy-fontFamily-display)", fontWeight: 500, fontSize: "clamp(1.4rem, 3vw, 2rem)", lineHeight: 1.2 }}>Recorded with {selected.phase.toLowerCase()}</Typography>
              </Box>
              <Box component="ul" aria-label={`Mood counts during ${selected.phase}`} sx={{ listStyle: "none", p: 0, m: 0, mt: 2, display: "grid", gap: 1 }}>
                {moods.map(([key, count]) => <Box component="li" key={key} sx={{ minWidth: 0, display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", columnGap: 1, rowGap: .5 }}>
                  <Typography level="body-sm" sx={{ overflowWrap: "anywhere" }}>{formatMood(key)}</Typography>
                  <Typography level="body-sm">{count}</Typography>
                  <Box aria-hidden="true" sx={{ gridColumn: "1 / -1", height: 6, bgcolor: "var(--al-theme-surface)", borderRadius: "xs", overflow: "hidden" }}><Box sx={{ width: `${count / largestMoodCount * 100}%`, height: "100%", bgcolor: "var(--al-theme-ink)", opacity: .65 }} /></Box>
                </Box>)}
              </Box>
              {moods.length === 0 && <Typography level="body-sm" sx={{ mt: 1 }}>No individual mood counts were returned for this phase.</Typography>}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1.5 }}>
                <Button variant="plain" color="neutral" onClick={() => setStep(0)} sx={{ minHeight: 44, px: 0 }}>Try another phase</Button>
                <Button variant="plain" onClick={() => setStep(2)} sx={{ minHeight: 44, px: 0 }}>Note it</Button>
              </Box>
            </Box> },
            { title: "Note it", hint: "optional", content: <>
              <StepHeading>Does this connect for you?</StepHeading>
              <InsightFeedback pathway="energy" moduleKey="daily-astrology" insightType="moon-phase" hideContentWhenNotForMe>
                <PathwayReflectionPrompt pathway="energy" moduleKey="daily-astrology" insightType="moon-phase" prompt="What, if anything, do these counts bring up for you?" />
              </InsightFeedback>
            </> },
          ]} /></Box>
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
