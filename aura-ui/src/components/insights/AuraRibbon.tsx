import { useId } from "react";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import type { RibbonPoint } from "@/features/insights/insightMetrics";

/** Props for {@link AuraRibbon}. */
export interface AuraRibbonProps {
  points: RibbonPoint[];
  /** Resolves a mood to its aura color; the ribbon's fill blends between these along the period. */
  colorFor: (mood: string) => string;
  /** Axis labels spread evenly under the ribbon (days, dates, or months). */
  labels: string[];
}

const WIDTH = 600;
const HEIGHT = 150;
const TOP = 14;
const BASE = 136;
/** Last element of an array (lib target predates Array.prototype.at). */
const last = <T,>(items: T[]): T | undefined => items[items.length - 1];
/** Energy 1–5 → SVG y, higher energy sits higher on the ribbon. */
const yFor = (energy: number) => BASE - ((energy - 1) / 4) * (BASE - TOP - 8);

/** Smooth horizontal-tangent curve through points, so the ribbon flows instead of zig-zagging. */
function curve(points: Array<[number, number]>): string {
  return points.reduce((path, [x, y], index) => {
    if (index === 0) return `M${x},${y}`;
    const [px, py] = points[index - 1];
    const mid = (px + x) / 2;
    return `${path} C${mid},${py} ${mid},${y} ${x},${y}`;
  }, "");
}

/**
 * The aura ribbon: energy over the selected period as one flowing curve whose color blends through
 * each check-in's aura color. Height is energy (activation), never a good/bad score. Periods without
 * check-ins are drawn as a dotted gap so they never read as a dip. Every point is listed for screen
 * readers and carries a hover title.
 */
export default function AuraRibbon({ points, colorFor, labels }: AuraRibbonProps) {
  const gradientId = `aura-ribbon-${useId().replace(/:/g, "")}`;
  const plotted = points.filter((point): point is RibbonPoint & { energy: number } => point.energy !== null);
  // Consecutive check-ins form solid segments; any gap point between them starts a new segment.
  const segments: Array<Array<RibbonPoint & { energy: number }>> = [];
  points.forEach((point) => {
    if (point.energy === null) { if (last(segments)?.length) segments.push([]); return; }
    if (!segments.length) segments.push([]);
    last(segments)!.push(point as RibbonPoint & { energy: number });
  });
  const solid = segments.filter((segment) => segment.length);
  const toXY = (point: RibbonPoint & { energy: number }): [number, number] => [12 + point.x * (WIDTH - 24), yFor(point.energy)];

  return (
    <Box>
      <Box component="svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={plotted.length ? "Aura ribbon of energy over this period. Details follow as a list." : "No check-ins in this period yet."} sx={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2={WIDTH} y1="0" y2="0" gradientUnits="userSpaceOnUse">
            {plotted.map((point, index) => <stop key={index} offset={`${(point.x * 100).toFixed(1)}%`} stopColor={point.mood ? colorFor(point.mood) : "var(--aura-accent)"} />)}
          </linearGradient>
        </defs>
        {/* Dotted connectors across empty days. */}
        {solid.slice(1).map((segment, index) => {
          const [x1, y1] = toXY(last(solid[index])!);
          const [x2, y2] = toXY(segment[0]);
          return <path key={`gap-${index}`} d={curve([[x1, y1], [x2, y2]])} fill="none" stroke="var(--aura-line)" strokeWidth={2} strokeDasharray="3 6" />;
        })}
        {solid.map((segment, index) => {
          const xy = segment.map(toXY);
          const line = xy.length === 1 ? `M${xy[0][0] - 6},${xy[0][1]} L${xy[0][0] + 6},${xy[0][1]}` : curve(xy);
          const area = `${line} L${last(xy)![0] + (xy.length === 1 ? 6 : 0)},${BASE + 6} L${xy[0][0] - (xy.length === 1 ? 6 : 0)},${BASE + 6} Z`;
          return (
            <g key={`seg-${index}`}>
              <path d={area} fill={`url(#${gradientId})`} opacity={0.45} />
              <path d={line} fill="none" stroke={`url(#${gradientId})`} strokeWidth={3} strokeLinecap="round" />
            </g>
          );
        })}
        {plotted.map((point, index) => {
          const [x, y] = toXY(point);
          return <circle key={index} cx={x} cy={y} r={4.5} fill="var(--al-theme-ink, #fff)"><title>{point.label}</title></circle>;
        })}
      </Box>
      <Box aria-hidden="true" sx={{ display: "flex", justifyContent: "space-between", px: 0.5 }}>
        {labels.map((label, index) => <Typography key={`${label}-${index}`} level="body-xs" color="neutral">{label}</Typography>)}
      </Box>
      <Box component="ul" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", m: 0, p: 0 }}>
        {points.map((point, index) => <li key={index}>{point.label}</li>)}
      </Box>
    </Box>
  );
}
