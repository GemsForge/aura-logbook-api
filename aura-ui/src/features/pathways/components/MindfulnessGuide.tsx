import { useState } from "react";
import { Box, Button, Link, Typography } from "@mui/joy";
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
  { title: "Observe", group: "What skill", practice: "Notice one sound or sensation. Try letting it be there without immediately describing it." },
  { title: "Describe", group: "What skill", practice: "Put one thing you notice into words: “I hear…” or “I notice…”" },
  { title: "Participate", group: "What skill", practice: "Choose one ordinary activity. Bring your attention to doing it for a moment." },
  { title: "Nonjudgmentally", group: "How skill", practice: "Notice a judgment, if one appears. Try describing what happened in factual words." },
  { title: "One-Mindfully", group: "How skill", practice: "Choose one thing to do. If your attention wanders, gently return to that activity." },
  { title: "Effectively", group: "How skill", practice: "Pause before a small next step. Ask what action would be useful in this moment." },
  { title: "Wise Mind", group: "DBT concept", practice: "Pause and notice what you feel and what you know. Make room for both before a small next step." },
] as const;

/** An educational field guide; optional module links only appear when enabled in the profile. */
export function MindfulnessGuide({ breathingEnabled = true, practiceLogEnabled = true }: {
  breathingEnabled?: boolean;
  practiceLogEnabled?: boolean;
}) {
  const [topic, setTopic] = useState<"concepts" | "dbt">("concepts");
  const [conceptIndex, setConceptIndex] = useState(0);
  const [skillIndex, setSkillIndex] = useState(0);
  const selected = topic === "concepts" ? concepts[conceptIndex] : dbtSkills[skillIndex];

  return <Box component="section" id="mindfulness-guide" aria-labelledby="mindfulness-title" sx={{ py: 2, minWidth: 0 }}>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.4fr) minmax(0, 1fr)" }, gap: { xs: 2, md: 3 }, alignItems: "start" }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography id="mindfulness-title" component="h2" level="title-lg">Mindfulness, in practice</Typography>
        <Typography level="body-sm" color="neutral" sx={{ mt: .5 }}>A little attention. A place to begin.</Typography>
        <Box role="group" aria-label="Guide topics" sx={{ display: "flex", flexWrap: "wrap", gap: .5, mt: 2 }}>
          <Button size="sm" variant={topic === "concepts" ? "soft" : "plain"} color="neutral" aria-pressed={topic === "concepts"} onClick={() => setTopic("concepts")} sx={{ minHeight: 44 }}>Everyday concepts</Button>
          <Button size="sm" variant={topic === "dbt" ? "soft" : "plain"} color="neutral" aria-pressed={topic === "dbt"} onClick={() => setTopic("dbt")} sx={{ minHeight: 44 }}>DBT skills</Button>
        </Box>
        <Box role="group" aria-label={topic === "concepts" ? "Mindfulness concepts" : "DBT mindfulness skills"} sx={{ display: "flex", flexWrap: "wrap", gap: .5, mt: 1, mb: 2 }}>
          {(topic === "concepts" ? concepts : dbtSkills).map((item, index) => <Button key={item.title} size="sm" variant="plain" color="neutral" aria-pressed={selected.title === item.title}
            onClick={() => topic === "concepts" ? setConceptIndex(index) : setSkillIndex(index)}
            sx={{ minHeight: 44, px: 1, borderRadius: "sm", color: "var(--al-theme-ink)", fontWeight: selected.title === item.title ? 700 : 400, textDecoration: selected.title === item.title ? "underline" : "none", textUnderlineOffset: ".3em" }}>
            {item.title}
          </Button>)}
        </Box>
        <Box className="aura-highlight" aria-live="polite" aria-atomic="true" sx={{ p: 2.5, bgcolor: "var(--al-theme-surface-raised)", borderRadius: "sm", minWidth: 0 }}>
          <Typography level="body-xs" color="neutral">{topic === "concepts" ? "Everyday mindfulness" : dbtSkills[skillIndex].group}</Typography>
          <Typography component="h3" level="h3" sx={{ mt: .5 }}>{selected.title}</Typography>
          <Typography level="body-md" sx={{ mt: 1, lineHeight: 1.65 }}>{topic === "concepts" ? concepts[conceptIndex].text : "A DBT mindfulness lens"}</Typography>
          {topic === "dbt" && <Typography level="body-sm" color="neutral" sx={{ mt: 1 }}>Dialectical Behavior Therapy describes three “what” skills—Observe, Describe, Participate—and three “how” skills—Nonjudgmentally, One-Mindfully, Effectively. Wise Mind is a DBT concept that makes room for emotion and reason.</Typography>}
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
      <Box component="aside" aria-label="A moment to practice" sx={{ minWidth: 0 }}>
        <Box component="img" src="/theme-assets/pathways/mindful/mindful-gentle-landscape.png" alt="" sx={{ display: "block", width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: "sm" }} />
        <Typography component="h3" level="title-md" sx={{ mt: 1.5 }}>Try a moment</Typography>
        <Typography level="body-sm" sx={{ mt: .75 }} aria-live="polite">{selected.practice}</Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: .5, mt: 1 }}>
          {breathingEnabled && <Button component="a" href="/pathways/breathing" size="sm" variant="plain" sx={{ minHeight: 44, px: .5 }}>Open breathing</Button>}
          {practiceLogEnabled && <Button component="a" href="/pathways/practice-log" size="sm" variant="plain" sx={{ minHeight: 44, px: .5 }}>Log a practice</Button>}
        </Box>
      </Box>
    </Box>
    <Box sx={{ mt: 2, pt: 1, maxWidth: 600 }}>
      <InsightFeedback pathway="mindfulness" moduleKey="mindfulness-guide" insightType="mindfulness-concept" hideContentWhenNotForMe>
        <PathwayReflectionPrompt pathway="mindfulness" moduleKey="mindfulness-guide" insightType="mindfulness-concept" prompt="What kind of mindful moment would you like to make room for?" />
      </InsightFeedback>
    </Box>
  </Box>;
}
