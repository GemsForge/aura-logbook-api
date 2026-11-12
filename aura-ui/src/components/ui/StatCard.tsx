import type { ReactNode } from "react";
import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import { getAccessibleTextColor } from "@/theme/auraTheme";

/** Props for {@link StatCard}. */
export interface StatCardProps {
  /** Small label above the value, e.g. "Streak". */
  label: string;
  /** The stat itself, e.g. "3 days" or "3.4". Kept to one line. */
  value: ReactNode;
  /** Optional muted suffix after the value, e.g. "/ 5". */
  unit?: string;
  /** Optional one-line note under the value, e.g. "+0.3 vs last week". */
  caption?: ReactNode;
  /** Optional decoration inline after the value (decorative only; mark it aria-hidden). */
  adornment?: ReactNode;
  /**
   * Optional solid fill (a hex color, e.g. an aura shade). Text ink is chosen for contrast against it,
   * so it reads the same in light and dark themes. Omit for the theme's raised surface.
   */
  tone?: string;
}

/**
 * The one compact stat card used across signed-in pages (Insights, Reflections), so every stat shares
 * the same size, padding, and type scale: a small label, a one-line value with optional unit and inline
 * adornment, and a caption line that is always reserved so every card in a row is the same height. It renders plain content (no landmark) because the visible text
 * already names the stat. Tinted cards pick contrast-safe ink automatically.
 */
export default function StatCard({ label, value, unit, caption, adornment, tone }: StatCardProps) {
  const ink = tone ? getAccessibleTextColor(tone) : undefined;
  return (
    <Sheet sx={{ px: 1.5, py: 1, minWidth: 0, height: "100%", boxSizing: "border-box", borderRadius: "lg", border: "1px solid var(--al-theme-border)", background: tone ?? "var(--al-theme-surface-raised)", color: ink ?? "var(--al-theme-ink)" }}>
      <Typography level="body-xs" sx={{ color: "inherit", opacity: .8, lineHeight: 1.3 }}>{label}</Typography>
      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", columnGap: .75, mt: .25 }}>
        <Typography sx={{ color: "inherit", fontWeight: 700, fontSize: "1.3rem", lineHeight: 1.2, overflowWrap: "anywhere" }}>
          {value}{unit && <Typography component="span" sx={{ color: "inherit", opacity: .75, fontWeight: 500, fontSize: ".85rem", ml: .5 }}>{unit}</Typography>}
        </Typography>
        {adornment}
      </Box>
      {/* The caption line is always reserved, so cards with and without a caption share one height. */}
      <Typography level="body-xs" aria-hidden={caption ? undefined : true} sx={{ color: "inherit", opacity: .8, mt: .25, minHeight: "1.5em" }}>{caption ?? "\u00a0"}</Typography>
    </Sheet>
  );
}
