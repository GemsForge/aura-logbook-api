import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import Link from "@mui/joy/Link";
import LinearProgress from "@mui/joy/LinearProgress";
import { AuraButton as Button } from "@/components/ui/AuraButton";
import { AuraInput } from "@/components/ui/AuraInput";
import { useCompleteOnboardingMutation } from "@/store/authApi";
import { useToast } from "@/hooks/useToast";
import type { SpiritualPathway } from "@/features/auth/models";
import { QUIZ_QUESTIONS, PATHWAY_NAMES, blendHues, scoreQuiz } from "@/features/onboarding/quiz";
import { CHECK_IN_OPENERS, ELEMENT_HUE, PATHWAY_FOCUS, sunSign, toggleFocus } from "@/features/onboarding/pathwayPages";
import { STEPS, buildOnboardingRequest, clearDraft, loadDraft, saveDraft, type OnboardingDraft } from "@/features/onboarding/draft";

/** Unlabeled color-moment swatches; names are screen-reader labels only. */
const SWATCHES = [
  { name: "Red", hue: 0, color: "#EF9A9A" }, { name: "Orange", hue: 35, color: "#FFB74D" },
  { name: "Gold", hue: 50, color: "#FFD54F" }, { name: "Green", hue: 125, color: "#A5D6A7" },
  { name: "Teal", hue: 175, color: "#80CBC4" }, { name: "Blue", hue: 210, color: "#90CAF9" },
  { name: "Violet", hue: 290, color: "#CE93D8" }, { name: "Rose", hue: 340, color: "#F48FB1" },
];

/** Reveal wording per pathway (spec §9); the aura is framed in each pathway's own language. */
const REVEAL_FRAME: Record<SpiritualPathway, string> = {
  Mindfulness: "Your tone right now",
  Energy: "Your aura is leaning",
  Faith: "Your heart's season",
};

/** Stable per-question shuffle so cards don't hint at the scoring pattern but don't jump on re-render. */
function shuffled<T>(items: readonly T[], seed: number): T[] {
  return [...items].sort((a, b) => ((items.indexOf(a) * 7 + seed) % 3) - ((items.indexOf(b) * 7 + seed) % 3));
}

/**
 * Onboarding flow (#342): five pathway questions, optional birthday, a wordless color moment, the
 * pathway + aura reveal, a pathway-specific page and reminders. Progress is kept in sessionStorage
 * so a refresh keeps answers; finishing (or skipping) saves through `PUT /Auth/me/onboarding`.
 * Mobile is a single column; at md+ the orb and heading sit left and the step panel right.
 */
export default function Onboarding() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [completeOnboarding, { isLoading }] = useCompleteOnboardingMutation();
  const [draft, setDraft] = useState<OnboardingDraft>(() => loadDraft());
  /** True after "Choose a different pathway": the reveal lists every pathway. */
  const [choosing, setChoosing] = useState(false);
  useEffect(() => saveDraft(draft), [draft]);

  const step = STEPS[draft.stepIndex];
  const score = useMemo(() => scoreQuiz(draft.answers), [draft.answers]);
  const blend = blendHues(draft.answers, draft.colorMomentHue);
  const orbHue = blend?.hue ?? 270;
  const pathway = draft.pathway ?? (score.leaders.length === 1 ? score.leaders[0] : undefined);
  const update = (patch: Partial<OnboardingDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const go = (delta: number) => update({ stepIndex: Math.min(Math.max(0, draft.stepIndex + delta), STEPS.length - 1) });
  const jump = (kind: (typeof STEPS)[number]["kind"]) => update({ stepIndex: STEPS.findIndex((s) => s.kind === kind) });

  const finish = async (skipAll = false) => {
    const body = buildOnboardingRequest(skipAll ? { ...draft, answers: {}, pathway: "Mindfulness", focus: [], checkInOpener: undefined } : { ...draft, pathway });
    try {
      await completeOnboarding(body).unwrap();
      clearDraft();
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const data = (err as { data?: unknown })?.data;
      showToast(typeof data === "string" ? data : "We couldn't save that. Please try again.", "error");
    }
  };

  const orbStyle = { width: { xs: 96, md: 300 }, "--aura-accent": `hsl(${orbHue} 65% 64%)`, "--aura-glow": `hsl(${orbHue} 70% 72% / 0.5)`, "--aura-line": `hsl(${orbHue} 70% 82% / 0.4)`, transition: "background 600ms" } as const;

  let eyebrow = "";
  let heading = "";
  let sub = "";
  let body: ReactNode = null;
  let primary: ReactNode = null;

  if (step.kind === "question") {
    const q = QUIZ_QUESTIONS[step.number - 1];
    eyebrow = `Question ${q.number} of 5`;
    heading = q.prompt;
    sub = "Pick the one that feels closest. No wrong answers.";
    body = (
      <Box role="radiogroup" aria-label={q.prompt} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {shuffled(q.options, q.number).map((o) => {
          const checked = draft.answers[q.number] === o.pathway;
          return (
            <Sheet key={o.pathway} component="button" type="button" role="radio" aria-checked={checked}
              onClick={() => update({ answers: { ...draft.answers, [q.number]: o.pathway }, pathway: undefined, focus: [], checkInOpener: undefined })}
              // Changing an answer can change the pathway, so earlier pathway-page picks are cleared.
              variant={checked ? "soft" : "outlined"}
              sx={{ display: "flex", alignItems: "center", gap: 2, minHeight: 68, px: 2, py: 1.5, borderRadius: "22px", cursor: "pointer", textAlign: "left", font: "inherit", fontSize: "md", color: "text.primary", borderWidth: checked ? 2 : 1, borderColor: checked ? "var(--al-theme-focus)" : undefined }}>
              <Box aria-hidden="true" sx={{ width: 30, height: 30, flexShrink: 0, borderRadius: "50%", background: `radial-gradient(circle at 33% 28%, rgba(255,255,255,.9), hsl(${o.hue} 70% 70%) 70%)` }} />
              {o.label}
            </Sheet>
          );
        })}
      </Box>
    );
    primary = <Button variant="contained" onClick={() => go(1)} disabled={!draft.answers[q.number]}>Next</Button>;
  } else if (step.kind === "birthday") {
    const sign = draft.birthday ? sunSign(draft.birthday) : undefined;
    eyebrow = "Optional · last question";
    heading = "Want insights tied to your sign?";
    sub = "Add your birthday and we'll weave your sun sign into your check-ins. Only you can see it.";
    body = (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <AuraInput label="Birthday" type="date" value={draft.birthday ?? ""} slotProps={{ input: { max: new Date().toISOString().slice(0, 10) } }}
          onChange={(e) => update({ birthday: e.target.value || undefined })} />
        {sign && <Typography level="body-sm">That makes you a <strong>{sign.sign}</strong> · {sign.element} sign.</Typography>}
      </Box>
    );
    primary = (
      <>
        <Button variant="contained" onClick={() => go(1)}>Continue</Button>
        <Button variant="plain" onClick={() => { update({ birthday: undefined }); go(1); }}>Not now</Button>
      </>
    );
  } else if (step.kind === "color") {
    eyebrow = "One more thing";
    heading = "Which one feels like right now?";
    sub = "Don't think. Just tap.";
    body = (
      <Box role="radiogroup" aria-label="Color that feels like right now" sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(3, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" }, gap: 2.5, justifyItems: "center" }}>
        {SWATCHES.map((s) => {
          const checked = draft.colorMomentHue === s.hue;
          return (
            <Box key={s.name} component="button" type="button" role="radio" aria-checked={checked} aria-label={s.name}
              onClick={() => update({ colorMomentHue: s.hue })}
              sx={{ width: 80, height: 80, borderRadius: "50%", cursor: "pointer", border: `3px solid ${checked ? "var(--al-theme-focus)" : "transparent"}`, background: `radial-gradient(circle at 33% 28%, rgba(255,255,255,.9), ${s.color} 62%)`, transform: checked ? "scale(1.08)" : "none", transition: "transform 200ms" }} />
          );
        })}
      </Box>
    );
    primary = <Button variant="contained" onClick={() => go(1)}>Reveal my aura</Button>;
  } else if (step.kind === "reveal") {
    const tied = choosing || (score.leaders.length > 1 && !draft.pathway);
    const options: SpiritualPathway[] = choosing ? ["Mindfulness", "Energy", "Faith"] : score.leaders;
    eyebrow = tied ? "You're drawn to more than one" : "You seem drawn to";
    heading = tied ? "Which feels most like you?" : PATHWAY_NAMES[pathway ?? "Mindfulness"];
    sub = !tied && score.runnerUp ? `with a little ${PATHWAY_NAMES[score.runnerUp]} too` : "";
    body = tied ? (
      <Box role="radiogroup" aria-label="Choose your pathway" sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {options.map((p) => (
          <Button key={p} variant="outlined" role="radio" aria-checked={false} onClick={() => { setChoosing(false); update({ pathway: p, focus: [], checkInOpener: undefined }); }}>{PATHWAY_NAMES[p]}</Button>
        ))}
      </Box>
    ) : (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography className="aura-eyebrow" level="body-xs">{REVEAL_FRAME[pathway ?? "Mindfulness"]}</Typography>
        <Typography level="title-lg" sx={{ fontFamily: "var(--joy-fontFamily-display)" }}>
          A color that will shift as you check in.
        </Typography>
        <Typography level="body-sm" color="neutral">Your aura starts from your answers and grows with your mood logs. It's a reflection, never a label.</Typography>
      </Box>
    );
    primary = tied ? null : (
      <>
        <Button variant="contained" onClick={() => { update({ pathway }); go(1); }}>This feels right</Button>
        <Button variant="plain" onClick={() => setChoosing(true)}>Choose a different pathway</Button>
      </>
    );
  } else if (step.kind === "pathway") {
    const p = pathway ?? "Mindfulness";
    const sign = draft.birthday ? sunSign(draft.birthday) : undefined;
    eyebrow = PATHWAY_NAMES[p];
    heading = p === "Energy" ? "Your sky, your aura's base" : p === "Faith" ? "Your heart's season" : "What would you like to tend?";
    sub = p === "Energy" ? "Your sign sets a starting tone. Your check-ins tint it from there." : p === "Faith" ? "Choose the encouragement you'd welcome each day." : "Choose one or two. Your prompts will lean toward them.";
    body = (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {p === "Energy" && (sign ? (
          <Typography level="body-md">{sign.sign} · {sign.element} · aura base <strong>{ELEMENT_HUE[sign.element].name}</strong></Typography>
        ) : (
          <Link component="button" onClick={() => jump("birthday")}>Add your birthday to see your sky</Link>
        ))}
        <Typography className="aura-eyebrow" level="body-xs">{p === "Energy" ? "I'd like nudges about" : p === "Faith" ? "Daily encouragement" : "Intentions"}</Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {PATHWAY_FOCUS[p].map((c) => (
            <Button key={c.key} variant={draft.focus.includes(c.key) ? "contained" : "outlined"} aria-pressed={draft.focus.includes(c.key)}
              onClick={() => update({ focus: toggleFocus(p, draft.focus, c.key) })}>{c.label}</Button>
          ))}
        </Box>
        {p === "Mindfulness" && (
          <>
            <Typography className="aura-eyebrow" level="body-xs">Start each check-in with</Typography>
            <Box role="radiogroup" aria-label="Check-in opener" sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1 }}>
              {CHECK_IN_OPENERS.map((o) => (
                <Button key={o.key} role="radio" aria-checked={draft.checkInOpener === o.key} variant={draft.checkInOpener === o.key ? "contained" : "outlined"}
                  onClick={() => update({ checkInOpener: o.key })}>{o.label}</Button>
              ))}
            </Box>
          </>
        )}
      </Box>
    );
    primary = <Button variant="contained" onClick={() => go(1)}>Continue</Button>;
  } else {
    eyebrow = "Gentle reminders";
    heading = "You're all set";
    sub = "One nudge a day, no streaks, no guilt. You can turn on reminders any time in Settings.";
    primary = <Button variant="contained" onClick={() => finish()} disabled={isLoading}>Enter my space</Button>;
  }

  const progress = step.kind === "question" ? (step.number / 5) * 100 : undefined;

  return (
    <Box sx={{ width: "100%", minWidth: 0, boxSizing: "border-box", display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: { xs: 3, md: 12 }, alignItems: "center", py: { xs: 2, md: 6 }, px: { xs: 0, md: 4 }, maxWidth: 1280, mx: "auto" }}>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: { xs: "center", md: "flex-start" }, textAlign: { xs: "center", md: "left" }, minWidth: 0 }}>
        <Box aria-hidden="true" className="aura-orb" sx={orbStyle as unknown as CSSProperties} />
        <Typography className="aura-eyebrow" level="body-xs" sx={{ mt: { xs: 3, md: 7 } }}>{eyebrow}</Typography>
        <Typography level="h1" className="aura-page-heading" sx={{ mt: 1 }}>{heading}</Typography>
        {sub && <Typography level="body-md" color="neutral" sx={{ mt: 1.5, maxWidth: 480 }}>{sub}</Typography>}
      </Box>
      <Sheet variant="outlined" className="aura-panel" sx={{ width: "100%", maxWidth: { xs: 480, md: 520 }, mx: { xs: "auto", md: 0 }, boxSizing: "border-box", p: { xs: 2, md: 4 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button variant="outlined" aria-label="Back" onClick={() => go(-1)} disabled={draft.stepIndex === 0} sx={{ minWidth: 44 }}>‹</Button>
          {progress !== undefined
            ? <LinearProgress determinate value={progress} aria-label="Quiz progress" sx={{ flexGrow: 1 }} />
            : <Box sx={{ flexGrow: 1 }} />}
          {step.kind !== "reminder" && (
            <Link component="button" onClick={() => (step.kind === "question" ? finish(true) : go(1))}>Skip</Link>
          )}
        </Box>
        {body}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>{primary}</Box>
      </Sheet>
    </Box>
  );
}
