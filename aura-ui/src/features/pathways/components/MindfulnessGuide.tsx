import { useState } from "react";
import { Box, Button, Link, Typography } from "@mui/joy";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import AirRounded from "@mui/icons-material/AirRounded";
import { InsightFeedback } from "./InsightFeedback";
import { PathwayReflectionPrompt } from "./PathwayReflectionPrompt";

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

/** Leads with a local practice invitation, then a browsable guide; enabled module links and journal saves remain explicit. */
export function MindfulnessGuide({ breathingEnabled = true, practiceLogEnabled = true }: {
  breathingEnabled?: boolean;
  practiceLogEnabled?: boolean;
}) {
  const [topic, setTopic] = useState<"concepts" | "dbt">("concepts");
  const [conceptIndex, setConceptIndex] = useState(0);
  const [skillIndex, setSkillIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const selected = topic === "concepts" ? concepts[conceptIndex] : dbtSkills[skillIndex];

  // A practice invitation is local UI state; beginning never records a completed practice.
  const selectTopic = (next: "concepts" | "dbt") => { setTopic(next); setStarted(false); };

  return <Box component="section" id="mindfulness-guide" aria-labelledby="mindfulness-title" sx={{ py: 2, minWidth: 0 }}>
    <Box className="aura-highlight" component="section" aria-labelledby="practice-invitation-title" sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.2fr) minmax(0, 1fr)" }, gap: { xs: 2, md: 3 }, alignItems: "center", p: { xs: 2.5, sm: 3.5 }, bgcolor: "var(--al-theme-surface-raised)", borderRadius: "sm", overflow: "hidden" }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography level="body-sm" color="neutral">A moment to practice</Typography>
        <Typography id="practice-invitation-title" component="h2" sx={{ fontFamily: "var(--joy-fontFamily-display)", fontSize: "clamp(1.75rem, 3vw, 2.5rem)", lineHeight: 1.2, mt: 1 }}>Notice what’s already here.</Typography>
        <Typography level="body-md" sx={{ mt: 1.5, maxWidth: "45ch", lineHeight: 1.6 }}>{selected.practice}</Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
          <Button size="sm" startDecorator={started ? <CheckRounded /> : <PlayArrowRounded />} aria-expanded={started} aria-controls="mindful-practice-cue" onClick={() => setStarted((value) => !value)} sx={{ minHeight: 44 }}>{started ? "Finish practice" : "Begin practice"}</Button>
          {breathingEnabled && <Button component="a" href="/pathways/breathing" size="sm" variant="plain" startDecorator={<AirRounded />} sx={{ minHeight: 44 }}>Open breathing</Button>}
        </Box>
        <Box id="mindful-practice-cue" hidden={!started} role="status" sx={{ mt: 2 }}>
          <Typography level="body-sm">Take your time. When your attention wanders, gently return.</Typography>
          {practiceLogEnabled && <Button component="a" href="/pathways/practice-log" size="sm" variant="plain" sx={{ minHeight: 44, mt: .5, px: 0 }}>Log a practice</Button>}
        </Box>
      </Box>
      <Box component="img" src="/theme-assets/pathways/mindful/mindful-gentle-landscape.png" alt="" sx={{ display: "block", width: "100%", maxHeight: { xs: 96, sm: 260 }, objectFit: "contain", justifySelf: "center" }} />
    </Box>
    <Box sx={{ mt: 4, minWidth: 0 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography id="mindfulness-title" component="h2" level="title-lg">Mindfulness, in practice</Typography>
        <Box role="group" aria-label="Guide topics" sx={{ display: "flex", flexWrap: "wrap", gap: .5, mt: 2 }}>
          <Button size="sm" variant={topic === "concepts" ? "soft" : "plain"} color="neutral" aria-pressed={topic === "concepts"} onClick={() => selectTopic("concepts")} sx={{ minHeight: 44 }}>Everyday concepts</Button>
          <Button size="sm" variant={topic === "dbt" ? "soft" : "plain"} color="neutral" aria-pressed={topic === "dbt"} onClick={() => selectTopic("dbt")} sx={{ minHeight: 44 }}>DBT skills</Button>
        </Box>
        <Box role="group" aria-label={topic === "concepts" ? "Mindfulness concepts" : "DBT mindfulness skills"} sx={{ display: "flex", flexWrap: "wrap", gap: .5, mt: 1, mb: 2 }}>
          {(topic === "concepts" ? concepts : dbtSkills).map((item, index) => <Button key={item.title} size="sm" variant="plain" color="neutral" aria-pressed={selected.title === item.title}
            onClick={() => { if (topic === "concepts") setConceptIndex(index); else setSkillIndex(index); setStarted(false); }}
            sx={{ minHeight: 44, px: 1, borderRadius: "sm", color: "var(--al-theme-ink)", fontWeight: selected.title === item.title ? 700 : 400, textDecoration: selected.title === item.title ? "underline" : "none", textUnderlineOffset: ".3em" }}>
            {item.title}
          </Button>)}
        </Box>
        <Box aria-live="polite" aria-atomic="true" sx={{ py: 1.5, pl: 2, borderLeft: "2px solid var(--al-theme-border)", minWidth: 0, maxWidth: "65ch" }}>
          <Typography level="body-xs" color="neutral">{topic === "concepts" ? "Everyday mindfulness" : dbtSkills[skillIndex].group}</Typography>
          <Typography component="h3" level="h3" sx={{ mt: .5 }}>{selected.title}</Typography>
          <Typography level="body-md" sx={{ mt: 1, lineHeight: 1.65 }}>{selected.text}</Typography>
        </Box>
        <Box component="details" sx={{ mt: 1.5, "& summary": { cursor: "pointer", py: 1, fontSize: "var(--joy-fontSize-sm)", color: "var(--al-theme-ink)", "&:focus-visible": { outline: "3px solid var(--al-theme-focus)", outlineOffset: 2 } } }}>
          <Box component="summary">About this guide & further reading</Box>
          <Typography level="body-xs" color="neutral" sx={{ mt: .5 }}>These are plain-language summaries of DBT terms, offered for learning rather than treatment. An educational overview, not therapy.</Typography>
          <Box sx={{ display: "grid", justifyItems: "start", gap: .75, mt: 1 }}>
            <Link level="body-sm" href="https://www.nccih.nih.gov/health/meditation-and-mindfulness-effectiveness-and-safety" target="_blank" rel="noreferrer">NCCIH mindfulness overview</Link>
            <Link level="body-sm" href="https://www.guilford.com/books/DBT-Skills-Training-Manual/Marsha-Linehan/9781462556359" target="_blank" rel="noreferrer">Linehan’s DBT Skills Training Manual</Link>
          </Box>
        </Box>
      </Box>
    </Box>
    {practiceLogEnabled && !started && <Button component="a" href="/pathways/practice-log" size="sm" variant="plain" sx={{ minHeight: 44, px: 0, mt: 1 }}>Log a practice</Button>}
    <Box sx={{ mt: 2, pt: 1, maxWidth: 600 }}>
      <InsightFeedback pathway="mindfulness" moduleKey="mindfulness-guide" insightType="mindfulness-concept" hideContentWhenNotForMe>
        <PathwayReflectionPrompt pathway="mindfulness" moduleKey="mindfulness-guide" insightType="mindfulness-concept" prompt="What kind of mindful moment would you like to make room for?" />
      </InsightFeedback>
    </Box>
  </Box>;
}
