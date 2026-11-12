import { useState, type ReactNode } from "react";
import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import SegmentedToggle from "@/components/ui/SegmentedToggle";
import WbSunnyOutlined from "@mui/icons-material/WbSunnyOutlined";
import MusicNoteOutlined from "@mui/icons-material/MusicNoteOutlined";
import PhotoOutlined from "@mui/icons-material/PhotoOutlined";
import BedtimeOutlined from "@mui/icons-material/BedtimeOutlined";
import { ThemeBanner } from "@/components/ui/ThemeBanner";
import StatCard from "@/components/ui/StatCard";
import AuraRibbon from "@/components/insights/AuraRibbon";
import {
  averageEnergy, checkInDays, energyFactors, entriesInRange, moodCounts, periodRange, previousRange, ribbonPoints,
  type EnergyFactor, type InsightPeriod,
} from "@/features/insights/insightMetrics";
import { computeCheckInStreak } from "@/features/mood/moodPatternSummary";
import { useGetZodiacInsightQuery } from "@/store/auraApi";
import { useGetAllMoodsQuery } from "@/store/moodApi";
import { useGetReferenceDataQuery } from "@/store/referenceDataApi";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { useAppSelector } from "@/store/hooks";

const PERIOD_WORD: Record<InsightPeriod, string> = { week: "week", month: "month", year: "year" };
/** Icon and tint for each "What shapes your energy" row. */
const FACTOR_ICONS: Record<EnergyFactor["key"], { icon: ReactNode; tint: string }> = {
  "clear-sky": { icon: <WbSunnyOutlined fontSize="small" />, tint: "#f2c94c" },
  music: { icon: <MusicNoteOutlined fontSize="small" />, tint: "#b39ddb" },
  photo: { icon: <PhotoOutlined fontSize="small" />, tint: "#80cbc4" },
  "late-night": { icon: <BedtimeOutlined fontSize="small" />, tint: "#f48fb1" },
};

/**
 * Insights: a Week / Month / Year filter over the top mood, streak, check-in days, the aura ribbon
 * (energy over time), average energy, the mood mix, and what shapes energy. Values lead and labels stay
 * small. Energy describes activation, never whether a mood is good or bad. Rows and comparisons appear
 * only with enough data, so there is no "log more" nag. The celestial lens stays Astrology & Energy only.
 */
export default function Insights() {
  const [period, setPeriod] = useState<InsightPeriod>("week");
  const user = useAppSelector(selectCurrentUser);
  const { data: entries = [], isLoading } = useGetAllMoodsQuery();
  const { data: referenceData } = useGetReferenceDataQuery();
  // Celestial data is neither requested nor rendered on shared/default pathways.
  const showAstrologyContent = user?.selectedPathway === "Energy";
  const { data: zodiac } = useGetZodiacInsightQuery(undefined, { skip: !showAstrologyContent });

  if (isLoading) return <Typography role="status" level="body-md" sx={{ py: 6, textAlign: "center" }}>Loading your insights…</Typography>;

  const moods = referenceData?.moods ?? [];
  const colorFor = (mood: string) => {
    const key = moods.find((definition) => definition.key === mood)?.auraColorKeys[0];
    return referenceData?.auras.find((aura) => aura.key === key)?.shades?.[500] ?? "var(--aura-accent)";
  };
  const range = periodRange(period);
  const current = entriesInRange(entries, range);
  const previous = entriesInRange(entries, previousRange(period, range));
  const mix = moodCounts(current);
  const energy = averageEnergy(current, moods);
  const previousEnergy = averageEnergy(previous, moods);
  const factors = energyFactors(current, moods);
  const streak = computeCheckInStreak(entries);
  const days = checkInDays(current);
  const axisLabels = period === "week"
    ? Array.from({ length: 7 }, (_, index) => range.start.add(index, "day").format("ddd"))
    : period === "month"
      ? [1, 8, 15, 22, range.end.date()].map((day) => String(day))
      : ["Jan", "Mar", "May", "Jul", "Sep", "Nov"];

  return (
    <Box className="signed-in-content" sx={{ maxWidth: 960, mx: "auto" }}>
      <ThemeBanner title="Insights" description={`Your energy and moods for ${range.label}.`} illustration="insights" />
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <SegmentedToggle label="Insights period" value={period} onChange={setPeriod}
          options={[{ value: "week", label: "Week" }, { value: "month", label: "Month" }, { value: "year", label: "Year" }]} />
      </Box>

      {entries.length === 0 ? (
        <Sheet className="aura-panel" sx={{ p: 2.5 }}>
          <Typography level="title-md">Your first check-in starts this page.</Typography>
          <Typography level="body-sm" color="neutral" sx={{ mt: .5 }}>Your average energy, streak, and aura ribbon show up here.</Typography>
        </Sheet>
      ) : (
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, minmax(0, 1fr))" } }}>
          {/* Stat row: average energy replaces top mood here (Reflections already shows top mood); all three share StatCard. */}
          <Box sx={{ gridColumn: { xs: "1 / -1", sm: "auto" }, minWidth: 0 }}>
            <StatCard label="Average energy" value={energy !== null ? energy.toFixed(1) : "—"} unit={energy !== null ? "/ 5" : undefined} tone={energy !== null ? "#c8ecc0" : undefined}
              caption={energy === null ? `No check-ins this ${PERIOD_WORD[period]} yet` : previousEnergy !== null ? `${formatDelta(energy - previousEnergy)} vs last ${PERIOD_WORD[period]}` : undefined} />
          </Box>
          <StatCard label="Streak" value={`${streak} ${streak === 1 ? "day" : "days"}`} caption={streak > 0 ? "in a row" : "Starts with your next check-in"} />
          <StatCard label="Check-ins" value={`${days} of ${range.elapsedDays}`} caption="days" />

          <Sheet component="section" aria-labelledby="ribbon-title" className="aura-panel" sx={{ gridColumn: "1 / -1", p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 1 }}>
              <Typography id="ribbon-title" component="h2" level="title-md">Aura ribbon</Typography>
              <Typography level="body-xs" color="neutral">higher = more energy</Typography>
            </Box>
            <AuraRibbon points={ribbonPoints(period, entries, range, moods)} colorFor={colorFor} labels={axisLabels} />
          </Sheet>

          <Sheet component="section" aria-labelledby="mix-title" className="aura-panel" sx={{ gridColumn: "1 / -1", p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <Typography id="mix-title" component="h2" level="title-md">Mood mix</Typography>
              <Typography level="body-xs" color="neutral">{mix.reduce((sum, [, count]) => sum + count, 0)} moods</Typography>
            </Box>
            {mix.length ? <>
              {/* Segmented bar: one entry fills it with a single color rather than leaving an empty chart. */}
              <Box aria-hidden="true" sx={{ display: "flex", gap: "3px", height: 10, mt: 1.25, borderRadius: 99, overflow: "hidden" }}>
                {mix.map(([mood, count]) => <Box key={mood} sx={{ flex: count, bgcolor: colorFor(mood) }} />)}
              </Box>
              <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, mt: 1.25, display: "flex", flexWrap: "wrap", columnGap: 2, rowGap: .5 }}>
                {mix.map(([mood, count]) => (
                  <Box component="li" key={mood} sx={{ display: "flex", alignItems: "center", gap: .75 }}>
                    <Box aria-hidden="true" sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: colorFor(mood) }} />
                    <Typography level="body-sm">{mood} <Typography fontWeight="lg">{count}</Typography></Typography>
                  </Box>
                ))}
              </Box>
            </> : <Typography level="body-sm" color="neutral" sx={{ mt: 1 }}>No check-ins this {PERIOD_WORD[period]} yet.</Typography>}
          </Sheet>

          {factors.length > 0 && (
            <Sheet component="section" aria-labelledby="factors-title" className="aura-panel" sx={{ gridColumn: "1 / -1", p: 2 }}>
              <Typography id="factors-title" component="h2" level="title-md">What shapes your energy</Typography>
              <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, mt: .5 }}>
                {factors.map((factor) => <FactorRow key={factor.key} factor={factor} />)}
              </Box>
              <Typography level="body-xs" color="neutral" sx={{ mt: .75 }}>Based on {current.length} {current.length === 1 ? "check-in" : "check-ins"}. Patterns, not causes.</Typography>
            </Sheet>
          )}
        </Box>
      )}

      {showAstrologyContent && zodiac && (
        <Sheet className="aura-panel" sx={{ p: 2, mt: 2 }}>
          <Typography level="h2" sx={{ fontSize: "1.1rem" }}>{zodiac.sign} • {zodiac.element}</Typography>
          <Typography level="body-sm" color="neutral">{String(zodiac.description ?? "")}</Typography>
          <Typography level="body-sm" color="neutral">{String(zodiac.insights?.[0]?.message ?? "")}</Typography>
        </Sheet>
      )}
    </Box>
  );
}

/** Signed one-decimal energy change; differences under 0.2 read as "About the same" rather than noise. */
function formatDelta(delta: number): string {
  if (Math.abs(delta) < 0.2) return "About the same";
  return `${delta > 0 ? "+" : "−"}${Math.abs(delta).toFixed(1)}`;
}

/** One "What shapes your energy" row: icon, label, the energy difference, and a bar sized to that difference. */
function FactorRow({ factor }: { factor: EnergyFactor }) {
  const { icon, tint } = FACTOR_ICONS[factor.key];
  const same = Math.abs(factor.delta) < 0.2;
  const tone = same ? "var(--al-theme-muted, #a3a8c8)" : factor.delta > 0 ? "#8fd6a8" : "#f4a3b8";
  return (
    <Box component="li" sx={{ display: "grid", gridTemplateColumns: "36px 1fr auto", columnGap: 1.5, rowGap: .5, alignItems: "center", py: 1 }}>
      <Box aria-hidden="true" sx={{ gridRow: "span 2", width: 36, height: 36, borderRadius: "50%", display: "grid", placeItems: "center", color: tint, bgcolor: `color-mix(in oklab, ${tint} 18%, transparent)` }}>{icon}</Box>
      <Typography level="body-md">{factor.label}</Typography>
      <Typography level="body-sm" sx={{ color: tone }}>{same ? "About the same" : `${formatDelta(factor.delta)} energy`}</Typography>
      <Box aria-hidden="true" sx={{ gridColumn: "2 / 4", height: 6, borderRadius: 99, bgcolor: "var(--aura-wash)", overflow: "hidden" }}>
        <Box sx={{ height: "100%", width: `${Math.max(8, Math.min(100, (Math.abs(factor.delta) / 2) * 100))}%`, bgcolor: factor.delta < -0.2 ? "#f48fb1" : same ? "var(--aura-line)" : "var(--al-theme-ink, #e8e9f3)", borderRadius: 99 }} />
      </Box>
    </Box>
  );
}
