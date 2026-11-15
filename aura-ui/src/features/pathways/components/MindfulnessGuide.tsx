import { useState } from "react";
import { Box, Button, Link, Typography } from "@mui/joy";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import AirRounded from "@mui/icons-material/AirRounded";
import { InsightFeedback } from "./InsightFeedback";
import { PathwayReflectionPrompt } from "./PathwayReflectionPrompt";
import { MoodChoiceButton } from "@/components/mood/MoodChoiceButton";
import { useGetReferenceDataQuery } from "@/store/referenceDataApi";
import { orderMoodChoices } from "@/features/mood/orderMoodChoices";
import { getQuickMoodNextStep } from "@/features/mood/quickMoodNextStep";
import type { MoodType } from "@/features/mood/models/schema/MoodType";
import { PathwaySteps, StepHeading, type PathwayStep } from "./PathwaySteps";

const concepts = [
  { title: "Notice now", text: "Bring attention to what is here: thoughts, sensations, feelings, or surroundings.", practice: "Pause and notice one sound, one sensation, or one thought. There is nothing to change." },
  { title: "Without judgment", text: "Name what you notice without immediately deciding it is good or bad.", practice: "Name one thing you notice using a few factual words. Let that description be enough." },
  { title: "Return gently", text: "When attention wanders, noticing and returning is part of the practice.", practice: "Notice where your attention is. Gently bring it back to one breath, without forcing the breath." },
  { title: "Start small", text: "Try one mindful breath or a few minutes. Pair it with a moment already in your day if that helps.", practice: "Choose an everyday pause, such as before a drink. Notice that one moment before continuing." },
  { title: "Make it your own", text: "Choose a practice and rhythm that fit you. A routine can change as your days change.", practice: "Choose a sound, a breath, or a few steps to notice. Stay with whichever feels comfortable today." },
  { title: "Begin again", text: "Missed days happen. Return when you’re ready; no streak or catch-up is needed.", practice: "Take one moment to notice your surroundings. This moment is a place to begin." },
] as const;

// Keep DBT's established skill names separate from Aura's brief, optional practice invitations.
const dbtSkills = [
  { title: "Observe", group: "What skill", text: "Notice your experience without needing to change it, hold on to it, or push it away.", practice: "Notice one sound or sensation. Try letting it be there without immediately describing it." },
  { title: "Describe", group: "What skill", text: "Put an observation into words. Separate what you notice from the conclusions you draw about it.", practice: "Put one thing you notice into words: “I hear…” or “I notice…”" },
  { title: "Participate", group: "What skill", text: "Bring your attention to taking part in an activity, rather than watching or evaluating yourself doing it.", practice: "Choose one ordinary activity. Bring your attention to doing it for a moment." },
  { title: "Nonjudgmentally", group: "How skill", text: "Describe what is happening without adding labels such as good, bad, right, or wrong.", practice: "Notice a judgment, if one appears. Try describing what happened in factual words." },
  { title: "One-Mindfully", group: "How skill", text: "Do one thing with attention. Noticing a distraction and returning are both part of the practice.", practice: "Choose one thing to do. If your attention wanders, gently return to that activity." },
  { title: "Effectively", group: "How skill", text: "Consider what works in this situation and choose an action that serves your goal.", practice: "Pause before a small next step. Ask what action would be useful in this moment." },
  { title: "Wise Mind", group: "DBT concept", text: "Make room for both emotion and reason when considering what feels wise in the present situation.", practice: "Pause and notice what you feel and what you know. Make room for both before a small next step." },
] as const;

/**
 * Maps a mood from the shared mood catalog to a suggested starting concept (an index into `concepts`).
 * The choice is local UI state, never saved, and is not an assessment of the person.
 */
function conceptForMood(mood: MoodType) {
  if (mood === "Weary" || mood === "Heavy") return 3; // Start small
  const next = getQuickMoodNextStep(mood);
  if (next?.kind === "grounding") return 2; // Return gently
  if (next?.kind === "reflection") return 0; // Notice now
  return 1; // Without judgment
}

type Step = 0 | 1 | 2;

/**
 * Presents the mindfulness guide as a short, skippable path: Arrive → Practice → Note it.
 * Only the current step is expanded; nothing is recorded until the person explicitly saves
 * a reflection or opens the practice log, keeping practice optional and non-diagnostic.
 */
export function MindfulnessGuide({ breathingEnabled = true, practiceLogEnabled = true }: {
  breathingEnabled?: boolean;
  practiceLogEnabled?: boolean;
}) {
  const [step, setStep] = useState<Step>(0);
  const [arrival, setArrival] = useState<MoodType>();
  const [topic, setTopic] = useState<"concepts" | "dbt">("concepts");
  const [conceptIndex, setConceptIndex] = useState(0);
  const [skillIndex, setSkillIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const selected = topic === "concepts" ? concepts[conceptIndex] : dbtSkills[skillIndex];

  // Changing the practice always resets the local cue; beginning never records a completed practice.
  const selectTopic = (next: "concepts" | "dbt") => { setTopic(next); setStarted(false); };
  const { data: referenceData } = useGetReferenceDataQuery();
  const moods = orderMoodChoices(referenceData?.moods ?? [], referenceData?.auras ?? []);
  const arrive = (mood?: MoodType) => {
    setArrival(mood);
    if (mood) { setTopic("concepts"); setConceptIndex(conceptForMood(mood)); setStarted(false); }
    setStep(1);
  };

  const steps: PathwayStep[] = [
    { title: "Arrive", summary: (arrival && moods.find((mood) => mood.key === arrival)?.displayName) ?? arrival ?? "Skipped", content: <>
              <StepHeading>How are you arriving?</StepHeading>
              <Typography level="body-sm" color="neutral" sx={{ mt: 1 }}>Pick a mood and we'll suggest a place to start. Nothing is saved.</Typography>
              {/* Same emotion buttons as the mood log, so moods look and read the same everywhere. */}
              {/* Wraps instead of scrolling so every mood is visible at once; the mood log keeps its carousel. */}
              <Box role="group" aria-label="Choose a mood" sx={{ display: "flex", flexWrap: "wrap", gap: .75, mt: 2 }}>
                {moods.map((mood) => {
                  const aura = referenceData?.auras.find((item) => item.key === mood.auraColorKeys[0]);
                  return <MoodChoiceButton key={mood.key} label={mood.displayName} icon={mood.icon} color={aura?.shades?.[500] ?? aura?.baseHex ?? "var(--al-theme-primary)"}
                    selected={arrival === mood.key} onClick={() => arrive(mood.key)} />;
                })}
              </Box>
              <Button variant="plain" color="neutral" onClick={() => arrive()} sx={{ minHeight: 44, mt: 1 }}>Skip</Button>
            </> },
    { title: "Practice", summary: selected.title, content: <>
              <StepHeading>{selected.title}</StepHeading>
              <Typography level="body-lg" sx={{ mt: 1, lineHeight: 1.6 }}>{selected.practice}</Typography>
              <Box component="img" src="/theme-assets/pathways/mindful/mindful-gentle-landscape.png" alt="" sx={{ display: "block", width: "100%", maxHeight: { xs: 110, sm: 200 }, objectFit: "contain", my: 2 }} />
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
                <Button startDecorator={started ? <CheckRounded /> : <PlayArrowRounded />} aria-expanded={started} aria-controls="mindful-practice-cue" onClick={() => setStarted((value) => !value)} sx={{ minHeight: 44, borderRadius: 999 }}>{started ? "Finish practice" : "Begin practice"}</Button>
                {breathingEnabled && <Button component="a" href="/pathways/breathing" variant="plain" startDecorator={<AirRounded />} sx={{ minHeight: 44 }}>Open breathing</Button>}
              </Box>
              <Box id="mindful-practice-cue" hidden={!started} role="status" sx={{ mt: 1.5 }}>
                <Typography level="body-sm">Take your time. When your attention wanders, gently return.</Typography>
                <Button variant="plain" onClick={() => { setStarted(false); setStep(2); }} sx={{ minHeight: 44, px: 0 }}>Continue to note it</Button>
              </Box>

              {/* Depth on demand: the full guide stays one tap away instead of crowding the practice. */}
              <Box component="details" sx={{ mt: 2.5, borderTop: "1px solid var(--al-theme-border)", "& > summary": { cursor: "pointer", py: 1.25, minHeight: 44, color: "var(--al-theme-ink)", fontWeight: 600, "&:focus-visible": { outline: "3px solid var(--al-theme-focus)", outlineOffset: 2 } } }}>
                <Box component="summary">Swap practice or learn the idea</Box>
                <Box role="group" aria-label="Guide topics" sx={{ display: "flex", gap: .5, mt: .5 }}>
                  <Button size="sm" variant={topic === "concepts" ? "soft" : "plain"} color="neutral" aria-pressed={topic === "concepts"} onClick={() => selectTopic("concepts")} sx={{ minHeight: 44 }}>Everyday concepts</Button>
                  <Button size="sm" variant={topic === "dbt" ? "soft" : "plain"} color="neutral" aria-pressed={topic === "dbt"} onClick={() => selectTopic("dbt")} sx={{ minHeight: 44 }}>DBT skills</Button>
                </Box>
                <Box role="group" aria-label={topic === "concepts" ? "Mindfulness concepts" : "DBT mindfulness skills"} sx={{ display: "flex", flexWrap: "wrap", gap: .5, mt: 1 }}>
                  {(topic === "concepts" ? concepts : dbtSkills).map((item, itemIndex) => <Button key={item.title} size="sm" variant={selected.title === item.title ? "soft" : "plain"} color="neutral" aria-pressed={selected.title === item.title}
                    onClick={() => { if (topic === "concepts") setConceptIndex(itemIndex); else setSkillIndex(itemIndex); setStarted(false); }}
                    sx={{ minHeight: 44, px: 1.25, borderRadius: 999, color: "var(--al-theme-ink)", fontWeight: selected.title === item.title ? 700 : 400 }}>{item.title}</Button>)}
                </Box>
                <Box sx={{ mt: 1.5, pl: 2, borderLeft: "2px solid var(--al-theme-border)" }}>
                  <Typography level="body-xs" color="neutral">{topic === "concepts" ? "The idea" : dbtSkills[skillIndex].group}</Typography>
                  <Typography level="body-md" sx={{ mt: .5, lineHeight: 1.65 }}>{selected.text}</Typography>
                </Box>
                <Typography level="body-xs" color="neutral" sx={{ mt: 1.5 }}>DBT terms are plain-language summaries for learning, not therapy.</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: .75, mb: 1 }}>
                  <Link level="body-sm" href="https://www.nccih.nih.gov/health/meditation-and-mindfulness-effectiveness-and-safety" target="_blank" rel="noreferrer">NCCIH mindfulness overview</Link>
                  <Link level="body-sm" href="https://www.guilford.com/books/DBT-Skills-Training-Manual/Marsha-Linehan/9781462556359" target="_blank" rel="noreferrer">Linehan’s DBT Skills Training Manual</Link>
                </Box>
              </Box>
              {!started && <Button variant="plain" color="neutral" onClick={() => setStep(2)} sx={{ minHeight: 44, px: 0, mt: 1 }}>Skip to note it</Button>}
            </> },
    { title: "Note it", hint: "optional", content: <>
              <StepHeading>Note it, if you like</StepHeading>
              <Typography level="body-sm" color="neutral" sx={{ mt: 1 }}>This step is optional. Nothing is saved unless you choose to.</Typography>
              <Box sx={{ mt: 2 }}>
                <InsightFeedback pathway="mindfulness" moduleKey="mindfulness-guide" insightType="mindfulness-concept" hideContentWhenNotForMe>
                  <PathwayReflectionPrompt pathway="mindfulness" moduleKey="mindfulness-guide" insightType="mindfulness-concept" prompt="What kind of mindful moment would you like to make room for?" />
                </InsightFeedback>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1 }}>
                {practiceLogEnabled && <Button component="a" href="/pathways/practice-log" variant="plain" sx={{ minHeight: 44, px: 0 }}>Log a practice</Button>}
                <Button variant="plain" color="neutral" onClick={() => { setStep(0); setArrival(undefined); }} sx={{ minHeight: 44, px: 0 }}>Start again</Button>
              </Box>
            </> },
  ];

  return <Box component="section" id="mindfulness-guide" aria-labelledby="mindfulness-title" sx={{ py: 2, minWidth: 0 }}>
    <Typography id="mindfulness-title" component="h2" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Mindful moment, in three steps</Typography>
    <PathwaySteps label="Steps" steps={steps} current={step} onStepChange={(index) => setStep(index as Step)} />
  </Box>;
}
