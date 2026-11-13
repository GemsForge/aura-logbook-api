import { useId } from "react";
import { Box, Typography } from "@mui/joy";

// Artwork depicts physical light and shadow: UI color schemes must never invert lunar illumination.
const moonArtwork = { shadow: "#242833", illuminated: "#ece9df", outline: "#70757e" };

const phaseShapes: Record<string, { shape: "new" | "full" | "quarter" | "crescent" | "gibbous"; waning?: boolean }> = {
  "new moon": { shape: "new" },
  "waxing crescent": { shape: "crescent" },
  "first quarter": { shape: "quarter" },
  "waxing gibbous": { shape: "gibbous" },
  "full moon": { shape: "full" },
  "waning gibbous": { shape: "gibbous", waning: true },
  "last quarter": { shape: "quarter", waning: true },
  "third quarter": { shape: "quarter", waning: true },
  "waning crescent": { shape: "crescent", waning: true },
};

/**
 * Illustrates a named phase with a conventional right-lit waxing / left-lit waning disc.
 * Geometry describes the phase category, never a measured illumination or today's moon.
 * Unknown provider labels receive no guessed lunar shape.
 */
export function MoonPhaseDisc({ phase, size = 64 }: { phase: string; size?: number }) {
  const clipId = useId();
  const normalized = phase.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/[_-]/g, " ").replace(/\s+/g, " ").trim();
  const definition = Object.prototype.hasOwnProperty.call(phaseShapes, normalized) ? phaseShapes[normalized] : undefined;
  if (!definition) return <Box component="span" sx={{ width: size, minHeight: size, display: "grid", placeItems: "center", flexShrink: 0 }}>
    <Typography component="span" level="body-xs" color="neutral" sx={{ textAlign: "center" }}>No phase illustration</Typography>
  </Box>;

  // The second arc is the terminator: its sweep changes a crescent to a gibbous.
  const illuminatedPath = definition.shape === "quarter"
    ? "M32 4 A28 28 0 0 1 32 60 Z"
    : `M32 4 A28 28 0 0 1 32 60 A18 28 0 0 ${definition.shape === "gibbous" ? 1 : 0} 32 4 Z`;

  return <svg role="img" aria-label={`${phase} phase illustration`} viewBox="0 0 64 64" width={size} height={size} style={{ display: "block", flexShrink: 0 }}>
    <defs><clipPath id={clipId}><circle cx="32" cy="32" r="28" /></clipPath></defs>
    <circle cx="32" cy="32" r="28" fill={moonArtwork.shadow} stroke={moonArtwork.outline} strokeWidth="1" />
    {definition.shape !== "new" && <g clipPath={`url(#${clipId})`} transform={definition.waning ? "translate(64 0) scale(-1 1)" : undefined}>
      {definition.shape === "full" ? <circle cx="32" cy="32" r="28" fill={moonArtwork.illuminated} /> : <path d={illuminatedPath} fill={moonArtwork.illuminated} />}
    </g>}
  </svg>;
}
