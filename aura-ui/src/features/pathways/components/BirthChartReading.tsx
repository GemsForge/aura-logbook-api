import { useEffect, useState } from "react";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Typography from "@mui/joy/Typography";
import { getNatalChart, type NatalChart } from "@/features/pathways/astrologyApi";
import { InsightFeedback } from "@/features/pathways/components/InsightFeedback";
import { PathwayReflectionPrompt } from "@/features/pathways/components/PathwayReflectionPrompt";

const chartPoints = new Set(["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "ascendant", "north node", "true node"]);
const pointSymbols: Record<string, string> = { sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂", jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆", pluto: "♇", ascendant: "Asc", "north node": "☊", "true node": "☊" };
// These labels explain the conventional lens, never infer a personality from provider coordinates.
const pointLenses: Record<string, { title: string; text: string }> = {
  sun: { title: "Identity & direction", text: "In astrology, the Sun is a lens for identity and what you choose to pursue." },
  moon: { title: "Emotional needs", text: "The Moon is commonly used to explore comfort, emotional needs, and familiar responses." },
  ascendant: { title: "How you meet the world", text: "The ascendant, or rising sign, is a lens for first impressions and approaching new situations." },
  mercury: { title: "Communication & learning", text: "Mercury is commonly associated with communication, thought, and learning." },
  venus: { title: "Connection & values", text: "Venus is commonly associated with relationships, enjoyment, and what you value." },
  mars: { title: "Action & motivation", text: "Mars is commonly associated with initiative, effort, and expressing your needs." },
  jupiter: { title: "Growth & possibility", text: "Jupiter is commonly associated with learning, expansion, and possibility." },
  saturn: { title: "Structure & responsibility", text: "Saturn is commonly associated with boundaries, commitment, and responsibility." },
  uranus: { title: "Change & independence", text: "Uranus is commonly associated with change, independence, and unfamiliar perspectives." },
  neptune: { title: "Imagination & ideals", text: "Neptune is commonly associated with imagination, ideals, and spiritual meaning." },
  pluto: { title: "Change & renewal", text: "Pluto is commonly associated with deep change, power, and renewal." },
  "north node": { title: "Growth & direction", text: "The north node is used in some astrology frameworks as a lens for growth and direction." },
  "true node": { title: "Growth & direction", text: "The true node is one calculation of the lunar node, used as a lens for growth and direction." },
};

/** Shows recognized provider placements with supplementary symbols after explicit birth-detail saving. */
export function BirthChartReading({ enabled }: { enabled: boolean }) {
  const [chart, setChart] = useState<NatalChart | null>(null);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState("sun");
  const [attempt, setAttempt] = useState(0);

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
  }, [enabled, attempt]);

  if (!enabled) return null;
  const placements = chart ? readPlacements(chart.chart) : [];
  const selected = placements.find((placement) => placement.name.toLowerCase() === selectedPoint) ?? placements[0];
  const lens = selected ? pointLenses[selected.name.toLowerCase()] : undefined;

  return <Box component="section" aria-labelledby="birth-chart-title" sx={{ minWidth: 0 }}>
    <Typography id="birth-chart-title" component="h2" level="title-lg">Birth chart</Typography>
    {loading ? <Typography role="status" level="body-sm" color="neutral" sx={{ mt: .5 }}>Calculating your chart…</Typography>
      : unavailable ? <Box sx={{ mt: .5 }}><Typography role="status" level="body-sm" color="neutral">Your chart is unavailable right now. Try again later.</Typography><Button variant="plain" size="sm" onClick={() => setAttempt((value) => value + 1)} sx={{ minHeight: 44 }}>Try again</Button></Box>
        : placements.length === 0 ? <Typography role="status" level="body-sm" color="neutral" sx={{ mt: .5 }}>No chart placements are available to display.</Typography>
          : <>
            <Typography level="body-xs" color="neutral" sx={{ mt: .5 }}>Select a placement to explore its lens.</Typography>
            <Box role="group" aria-label="Birth chart placements" sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: .5, mt: 1.5 }}>
              {placements.map((placement) => <Button key={placement.name} size="sm" variant={selected?.name === placement.name ? "soft" : "plain"} color="neutral" aria-pressed={selected?.name === placement.name}
                onClick={() => setSelectedPoint(placement.name.toLowerCase())}
                sx={{ minWidth: 0, minHeight: 88, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: .5, px: 1, py: 1, borderRadius: "xs", borderBottom: "2px solid", borderColor: selected?.name === placement.name ? "var(--al-theme-ink)" : "transparent", textAlign: "left", color: "var(--al-theme-ink)" }}>
                <Typography component="span" aria-hidden="true" sx={{ fontSize: "1.25rem", lineHeight: 1.2 }}>{pointSymbols[placement.name.toLowerCase()]}</Typography>
                <Typography component="span" level="body-xs" sx={{ color: "inherit", overflowWrap: "anywhere" }}>{placement.name === "Ascendant" ? "Rising" : placement.name}</Typography>
                <Typography component="span" level="title-sm" sx={{ color: "inherit", overflowWrap: "anywhere" }}>{placement.sign}</Typography>
              </Button>)}
            </Box>
            {selected && <Box aria-live="polite" aria-atomic="true" sx={{ mt: 2, minWidth: 0 }}>
              <Typography component="h3" level="title-md">{lens?.title ?? selected.name}</Typography>
              <Typography level="body-sm" color="neutral" sx={{ mt: .75, lineHeight: 1.6 }}>{lens?.text}</Typography>
              {(selected.degree || selected.house) && <Typography level="body-xs" color="neutral" sx={{ mt: 1 }}>{[selected.degree ? `${selected.degree}°` : null, selected.house ? `House ${selected.house}` : null].filter(Boolean).join(" · ")}</Typography>}
            </Box>}
            <Typography level="body-xs" color="neutral" sx={{ mt: 1.5 }}>{chart?.provider} · A symbolic reference for reflection, not a prediction or diagnosis.</Typography>
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
