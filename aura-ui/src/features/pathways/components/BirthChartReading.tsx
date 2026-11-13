import { useEffect, useState } from "react";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import { getNatalChart, type NatalChart } from "@/features/pathways/astrologyApi";
import { InsightFeedback } from "@/features/pathways/components/InsightFeedback";
import { PathwayReflectionPrompt } from "@/features/pathways/components/PathwayReflectionPrompt";

const chartPoints = new Set(["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "ascendant", "north node", "true node"]);

/** Shows recognized provider placements only when the user explicitly saved their chart details. */
export function BirthChartReading({ enabled }: { enabled: boolean }) {
  const [chart, setChart] = useState<NatalChart | null>(null);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setChart(null);
      setUnavailable(false);
      return;
    }

    let active = true;
    setLoading(true);
    setUnavailable(false);
    void getNatalChart()
      .then((result) => { if (active) setChart(result); })
      .catch(() => { if (active) setUnavailable(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [enabled]);

  if (!enabled) return null;
  const placements = chart ? readPlacements(chart.chart) : [];

  return <Box component="section" aria-labelledby="birth-chart-title" sx={{ mt: 1.5, pt: 1.25, borderTop: "1px solid var(--al-theme-border)" }}>
    <Typography id="birth-chart-title" level="title-sm">Birth chart</Typography>
    {loading ? <Typography role="status" level="body-sm" color="neutral" sx={{ mt: .5 }}>Calculating your chart…</Typography>
      : unavailable ? <Typography role="status" level="body-sm" color="neutral" sx={{ mt: .5 }}>Your chart is unavailable right now. Try again later.</Typography>
        : placements.length === 0 ? <Typography role="status" level="body-sm" color="neutral" sx={{ mt: .5 }}>No chart placements are available to display.</Typography>
          : <>
            <Box component="dl" sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))" }, gap: 1, m: 0, mt: .75 }}>
              {placements.map((placement) => <Box component="div" key={placement.name} sx={{ py: .5 }}>
                <Typography component="dt" level="body-xs" color="neutral">{placement.name}</Typography>
                <Typography component="dd" level="title-sm" sx={{ m: 0 }}>{placement.sign}{placement.degree ? ` · ${placement.degree}°` : ""}</Typography>
                {placement.house && <Typography level="body-xs" color="neutral">House {placement.house}</Typography>}
              </Box>)}
            </Box>
            <Typography level="body-xs" color="neutral" sx={{ mt: .75 }}>{chart?.provider} · A symbolic reference for reflection, not a prediction or diagnosis.</Typography>
            <InsightFeedback pathway="energy" moduleKey="daily-astrology" insightType="birth-chart-placement" hideContentWhenNotForMe>
              <PathwayReflectionPrompt pathway="energy" moduleKey="daily-astrology" insightType="birth-chart-placement" prompt="Which placements, if any, feel familiar or worth exploring?" />
            </InsightFeedback>
          </>}
  </Box>;
}

interface ChartPlacement { name: string; sign: string; degree?: string; house?: string }

/** Extracts familiar planet placements without rendering arbitrary provider response fields. */
function readPlacements(chart: unknown): ChartPlacement[] {
  const found = new Map<string, ChartPlacement>();
  const visit = (value: unknown, keyHint = "") => {
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, keyHint));
      return;
    }
    if (value === null || typeof value !== "object") return;

    const record = value as Record<string, unknown>;
    const name = firstString(record, ["name", "point", "planet"]) ?? keyHint;
    const sign = firstString(record, ["sign", "zodiac_sign", "zodiacSign", "sign_name"]);
    if (sign && chartPoints.has(name.toLowerCase())) {
      found.set(name.toLowerCase(), {
        name: formatPointName(name),
        sign,
        degree: firstNumberOrString(record, ["degree", "longitude", "position"]),
        house: firstNumberOrString(record, ["house", "house_number"]),
      });
    }

    for (const [key, child] of Object.entries(record)) visit(child, key);
  };
  visit(chart);
  return [...found.values()];
}

/** Reads a known placement label from a provider object. */
function firstString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) if (typeof record[key] === "string") return record[key] as string;
  return undefined;
}

/** Reads optional numeric placement metadata without exposing raw provider objects. */
function firstNumberOrString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" || typeof value === "string") return String(value);
  }
  return undefined;
}

/** Formats provider keys such as `north_node` for display. */
function formatPointName(name: string): string {
  return name.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
