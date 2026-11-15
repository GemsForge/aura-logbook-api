import { useEffect, useRef, type ReactNode } from "react";
import { Box, Button, Typography } from "@mui/joy";

/** One step of a pathway module's short path. */
export interface PathwayStep {
  /** Short verb-led name shown on the rail, e.g. "Arrive". */
  title: string;
  /** One-line answer shown once the step is behind the person, e.g. "Scattered". */
  summary?: string;
  /** One-line hint shown while the step is still ahead, e.g. "optional". */
  hint?: string;
  /** The step's body; only the current step's content is rendered. */
  content: ReactNode;
}

/**
 * Shared shell for pathway modules: a short, skippable sequence where only the current step is open.
 * Mobile shows a vertical rail with collapsed one-line rows; desktop moves the rail into a sticky
 * left column. Every step stays reachable, so the path guides without gating anything.
 */
export function PathwaySteps({ steps, current, onStepChange, label }: {
  steps: PathwayStep[];
  current: number;
  onStepChange: (index: number) => void;
  /** Accessible name for the step list, e.g. "Mindful moment steps". */
  label: string;
}) {
  const note = (step: PathwayStep, index: number) => index < current ? step.summary : index > current ? step.hint : undefined;
  // Screen-reader-only progress state, since the rail dots are decorative.
  const state = (index: number) => index < current ? "completed" : index === current ? "current step" : "not started";
  const openStep = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  // Step changes unmount the control that had focus, so move focus to the newly opened step.
  // Skipped on first render so arriving on the page never steals focus.
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    openStep.current?.focus();
  }, [current]);

  return <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "200px minmax(0, 1fr)" }, gap: { xs: 1, md: 5 }, alignItems: "start", minWidth: 0 }}>
    <Box component="ol" aria-label={label} sx={{ display: { xs: "none", md: "block" }, listStyle: "none", m: 0, p: 0, position: "sticky", top: 24 }}>
      {steps.map((step, index) => <StepRow key={step.title} index={index} current={current} last={index === steps.length - 1}>
        <Button variant="plain" color="neutral" aria-current={current === index ? "step" : undefined} onClick={() => onStepChange(index)}
          sx={{ minHeight: 44, px: 0, justifyContent: "flex-start", textAlign: "left", fontWeight: current === index ? 700 : 500, color: current === index ? "var(--al-theme-ink)" : "var(--al-theme-ink-muted)" }}>
          <Box component="span" sx={{ display: "grid" }}>
            {step.title}
            {note(step, index) && <Typography component="span" level="body-xs" color="neutral">{note(step, index)}</Typography>}
            <VisuallyHidden>, {state(index)}</VisuallyHidden>
          </Box>
        </Button>
      </StepRow>)}
    </Box>

    <Box component="ol" aria-label={label} sx={{ listStyle: "none", m: 0, p: 0, minWidth: 0 }}>
      {steps.map((step, index) => <StepRow key={step.title} index={index} current={current} last={index === steps.length - 1} mobileOnlyRail>
        {current !== index
          // Collapsed rows are mobile-only; on desktop the left rail already lists every step.
          ? <Button variant="plain" color="neutral" onClick={() => onStepChange(index)} sx={{ display: { xs: "flex", md: "none" }, minHeight: 44, px: 0, justifyContent: "flex-start", gap: 1, color: "var(--al-theme-ink)" }}>
            <strong>{step.title}</strong>
            {note(step, index) && <Typography component="span" level="body-sm" color="neutral">{note(step, index)}</Typography>}
            <VisuallyHidden>, {state(index)}</VisuallyHidden>
          </Button>
          // No live region here: focus moves to this group, which announces its name instead of reading the whole step.
          : <Box ref={openStep} role="group" aria-label={`${step.title}, step ${index + 1} of ${steps.length}`} tabIndex={-1} sx={{ pb: 3, minWidth: 0, maxWidth: 600, outline: "none", "&:focus-visible": { outline: "3px solid var(--al-theme-focus)", outlineOffset: 4, borderRadius: "sm" } }}>
            <Typography level="body-xs" color="neutral">Step {index + 1} of {steps.length}</Typography>
            {step.content}
          </Box>}
      </StepRow>)}
    </Box>
  </Box>;
}

/** Text read by screen readers but not shown on screen. */
function VisuallyHidden({ children }: { children: ReactNode }) {
  return <Box component="span" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>{children}</Box>;
}

/** Display-scale heading used at the top of each open step. */
export function StepHeading({ children }: { children: ReactNode }) {
  return <Typography component="h3" level="h3" sx={{ fontFamily: "var(--joy-fontFamily-display)", fontWeight: 500, fontSize: "clamp(1.6rem, 3vw, 2.2rem)", lineHeight: 1.2, mt: .5 }}>{children}</Typography>;
}

/**
 * One row of the path: a node (done, current, upcoming) on a vertical stem beside its content.
 * `mobileOnlyRail` hides the node on desktop, where the separate overview rail shows progress.
 */
function StepRow({ index, current, last, mobileOnlyRail, children }: { index: number; current: number; last: boolean; mobileOnlyRail?: boolean; children: ReactNode }) {
  const state = index < current ? "done" : index === current ? "now" : "next";
  return <Box component="li" sx={{ display: "grid", gridTemplateColumns: mobileOnlyRail ? { xs: "22px minmax(0, 1fr)", md: "minmax(0, 1fr)" } : "22px minmax(0, 1fr)", columnGap: 1.5 }}>
    <Box aria-hidden sx={{ display: mobileOnlyRail ? { xs: "flex", md: "none" } : "flex", flexDirection: "column", alignItems: "center", pt: 1.5 }}>
      <Box sx={{ width: 16, height: 16, flexShrink: 0, borderRadius: "50%", border: "2px solid", borderColor: state === "now" ? "var(--al-theme-accent)" : "var(--al-theme-ink)", bgcolor: state === "done" ? "var(--al-theme-ink)" : "transparent", boxShadow: state === "now" ? "0 0 0 4px var(--al-theme-surface-raised)" : "none" }} />
      {!last && <Box sx={{ flex: 1, width: 2, minHeight: 20, mt: .5, bgcolor: "var(--al-theme-border)" }} />}
    </Box>
    <Box sx={{ minWidth: 0 }}>{children}</Box>
  </Box>;
}
