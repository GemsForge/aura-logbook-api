import { useEffect, useState } from "react";
import { Box, IconButton, MenuItem, Select, Tooltip, Typography } from "@mui/material";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import PauseRounded from "@mui/icons-material/PauseRounded";
import RestartAltRounded from "@mui/icons-material/RestartAltRounded";

type Cadence = "4-6" | "3-3";

/** Offers a paced visual breathing guide with gentle 4/6 and 3/3 cycles and no breath holds. */
export default function BreathingTimer() {
  const [cadence, setCadence] = useState<Cadence>("4-6");
  const [running, setRunning] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const inhale = cadence === "4-6" ? 4 : 3;
  const exhale = cadence === "4-6" ? 6 : 3;
  const cycle = inhale + exhale;
  const phasePosition = elapsed % cycle;
  const isInhale = phasePosition < inhale;
  const remaining = isInhale ? inhale - phasePosition : cycle - phasePosition;
  // A started-but-paused session says so, rather than looking like it never began.
  const idleLabel = sessionStarted ? "Paused" : "Ready";

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  const reset = () => { setRunning(false); setElapsed(0); setSessionStarted(false); };
  const cadenceAnimation = cadence === "4-6" ? "breathe-46" : "breathe-33";

  return <Box className="signed-in-content" sx={{ maxWidth: 720, mx: "auto", py: { xs: 2, md: 4 } }}>
    <Typography component="h1" variant="h3">Breathing timer</Typography>
    <Typography color="text.secondary" sx={{ mt: .5 }}>Follow the shape. Pause anytime.</Typography>

    <Box component="section" aria-label="Breathing guide" sx={{
      mt: 2, minHeight: { xs: 340, sm: 380 }, display: "grid", placeItems: "center", position: "relative", overflow: "hidden",
    }}>
      <Box sx={{ display: "grid", justifyItems: "center", gap: 1.5, zIndex: 1 }}>
        <Box role="img" aria-label={running ? `${isInhale ? "Inhale" : "Exhale"}, ${remaining} seconds` : idleLabel} sx={{
          width: { xs: 120, sm: 136 }, aspectRatio: "1", display: "grid", placeItems: "center", borderRadius: "50%",
          color: "#2b1935", background: "radial-gradient(circle at 34% 28%, #f0dcf7 0%, #c18bd5 52%, #79558f 100%)",
          boxShadow: "0 0 32px color-mix(in srgb, var(--aura-accent) 22%, transparent)",
          animation: sessionStarted ? `${cadenceAnimation} ${cycle}s ease-in-out infinite` : "none",
          animationPlayState: running ? "running" : "paused",
          "@keyframes breathe-46": { "0%, 100%": { transform: "scale(.78)" }, "40%": { transform: "scale(1.08)" } },
          "@keyframes breathe-33": { "0%, 100%": { transform: "scale(.78)" }, "50%": { transform: "scale(1.08)" } },
          "@media (prefers-reduced-motion: reduce)": { animation: "none", transform: running && isInhale ? "scale(1.04)" : "scale(.82)" },
        }}>
          <Box sx={{ textAlign: "center" }}>
            <Typography component="span" variant="h6">{running ? isInhale ? "Inhale" : "Exhale" : idleLabel}</Typography>
            {running && <Typography component="span" display="block" variant="body2">{remaining}</Typography>}
          </Box>
        </Box>
        <Typography variant="h6" component="p" sx={{ minHeight: 28 }}>{running ? `${isInhale ? "Breathe in" : "Breathe out"} · ${remaining}` : sessionStarted ? "Paused · resume when you’re ready" : "Begin when you’re ready"}</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Select size="small" value={cadence} onChange={(event) => { setCadence(event.target.value as Cadence); setElapsed(0); setSessionStarted(false); setRunning(false); }} inputProps={{ "aria-label": "Breathing cadence" }} sx={{ minWidth: 118, minHeight: 38, borderRadius: 1 }}>
            <MenuItem value="4-6">4 in · 6 out</MenuItem>
            <MenuItem value="3-3">3 in · 3 out</MenuItem>
          </Select>
          <Tooltip title={running ? "Pause breathing" : sessionStarted ? "Resume breathing" : "Start breathing"}>
            <IconButton color="primary" aria-label={running ? "Pause breathing" : sessionStarted ? "Resume breathing" : "Start breathing"} onClick={() => { setSessionStarted(true); setRunning((value) => !value); }} size="small" sx={{ minWidth: 44, minHeight: 44 }}>
              {running ? <PauseRounded /> : <PlayArrowRounded />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset">
            <IconButton aria-label="Reset breathing" onClick={reset} size="small" sx={{ minWidth: 44, minHeight: 44 }}><RestartAltRounded /></IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  </Box>;
}
