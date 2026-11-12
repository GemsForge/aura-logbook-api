import dayjs, { type Dayjs } from "dayjs";
import type { MoodEntry } from "@/features/mood/models/schema";
import type { MoodDefinition } from "@/store/referenceDataApi";

/** Insights filter periods. Week is the last seven days; month and year are the current calendar month and year. */
export type InsightPeriod = "week" | "month" | "year";

/** Inclusive date range for a period, plus how many of its days have elapsed (future days never count against Alex). */
export interface PeriodRange { start: Dayjs; end: Dayjs; elapsedDays: number; label: string }

/** Neutral default for moods without a configured energy level (older API responses). */
const DEFAULT_ENERGY = 3;
/** Minimum check-ins on each side of a comparison before a factor row is shown; fewer would overstate a pattern. */
export const MIN_FACTOR_SAMPLE = 2;
/** Minimum check-ins in one part of the day before it can be called the liveliest time. */
export const MIN_TIME_SAMPLE = 3;

/** Resolves a period to its date range relative to `reference` (today by default). */
export function periodRange(period: InsightPeriod, reference: Date = new Date()): PeriodRange {
  const today = dayjs(reference).startOf("day");
  if (period === "week") {
    const start = today.subtract(6, "day");
    return { start, end: today, elapsedDays: 7, label: `${start.format("MMM D")} – ${today.format(start.month() === today.month() ? "D" : "MMM D")}` };
  }
  const start = today.startOf(period);
  return { start, end: today.endOf(period).startOf("day"), elapsedDays: today.diff(start, "day") + 1, label: today.format(period === "month" ? "MMMM YYYY" : "YYYY") };
}

/** The equally long range immediately before `range`, used for "vs last week" comparisons. */
export function previousRange(period: InsightPeriod, range: PeriodRange): PeriodRange {
  if (period === "week") {
    const end = range.start.subtract(1, "day");
    return { start: end.subtract(6, "day"), end, elapsedDays: 7, label: "" };
  }
  const start = range.start.subtract(1, period);
  return { start, end: start.endOf(period).startOf("day"), elapsedDays: start.endOf(period).diff(start, "day") + 1, label: "" };
}

/** Entries whose calendar date falls inside the range. */
export function entriesInRange(entries: MoodEntry[], range: PeriodRange): MoodEntry[] {
  return entries.filter((entry) => {
    const day = dayjs(entry.date);
    return !day.isBefore(range.start, "day") && !day.isAfter(range.end, "day");
  });
}

/** An entry's energy: the mean energy level of its moods (1 = low, 5 = high). Describes activation, not good or bad. */
export function entryEnergy(entry: MoodEntry, moods: MoodDefinition[]): number {
  const levels = entry.moods.map((mood) => moods.find((definition) => definition.key === mood)?.energyLevel ?? DEFAULT_ENERGY);
  return levels.length ? levels.reduce((sum, level) => sum + level, 0) / levels.length : DEFAULT_ENERGY;
}

/** Mean energy across entries, or null when there are none. */
export function averageEnergy(entries: MoodEntry[], moods: MoodDefinition[]): number | null {
  return entries.length ? entries.reduce((sum, entry) => sum + entryEnergy(entry, moods), 0) / entries.length : null;
}

/** Local time an entry was logged; falls back to noon on its date for entries without a timestamp. */
export function loggedAt(entry: MoodEntry): Dayjs {
  return entry.createdAt ? dayjs(entry.createdAt) : dayjs(entry.date).hour(12);
}

/** One point on the aura ribbon: horizontal position 0–1, energy 1–5 (null = no check-in, drawn as a gap), and a hover label. */
/** `moods` lists every mood behind the point (all of a check-in's moods, or a period's most frequent), so the ribbon's color matches the mood mix. */
export interface RibbonPoint { x: number; energy: number | null; mood: string | null; moods: string[]; label: string }

/**
 * Ribbon points for a period. Week plots every check-in at its logged time, so swings within a day show;
 * month averages each day and year averages each month. Empty days or months become null gap points so a
 * skipped day never reads as a dip.
 */
export function ribbonPoints(period: InsightPeriod, entries: MoodEntry[], range: PeriodRange, moods: MoodDefinition[]): RibbonPoint[] {
  const inRange = entriesInRange(entries, range);
  if (period === "week") {
    const points: RibbonPoint[] = [];
    for (let day = 0; day < 7; day++) {
      const date = range.start.add(day, "day");
      const dayEntries = inRange.filter((entry) => dayjs(entry.date).isSame(date, "day")).sort((a, b) => loggedAt(a).valueOf() - loggedAt(b).valueOf());
      if (!dayEntries.length) { points.push({ x: (day + 0.5) / 7, energy: null, mood: null, moods: [], label: `${date.format("ddd")}: no check-in` }); continue; }
      dayEntries.forEach((entry) => {
        const time = loggedAt(entry);
        const fraction = (time.hour() * 60 + time.minute()) / 1440;
        points.push({ x: (day + Math.min(Math.max(fraction, 0.08), 0.92)) / 7, energy: entryEnergy(entry, moods), mood: entry.moods[0] ?? null, moods: entry.moods, label: `${date.format("ddd")} · ${entry.moods.join(", ")} · ${time.format("h:mm A")}` });
      });
    }
    return points;
  }
  const unit = period === "month" ? "day" : "month";
  const buckets = period === "month" ? range.end.date() : 12;
  return Array.from({ length: buckets }, (_, index) => {
    const slot = range.start.add(index, unit);
    const slotEntries = inRange.filter((entry) => dayjs(entry.date).isSame(slot, unit));
    const label = slot.format(period === "month" ? "MMM D" : "MMMM");
    return { x: (index + 0.5) / buckets, energy: averageEnergy(slotEntries, moods), mood: topMood(slotEntries)?.mood ?? null, moods: moodCounts(slotEntries).slice(0, 3).map(([mood]) => mood), label: slotEntries.length ? `${label} · mostly ${topMood(slotEntries)?.mood}` : `${label}: no check-ins` };
  });
}

/** Most frequent mood across entries (ties broken alphabetically) with its count and the total moods logged. */
export function topMood(entries: MoodEntry[]): { mood: string; count: number; total: number } | null {
  const counts = moodCounts(entries);
  const total = counts.reduce((sum, [, count]) => sum + count, 0);
  return counts[0] ? { mood: counts[0][0], count: counts[0][1], total } : null;
}

/** Mood counts, most frequent first. */
export function moodCounts(entries: MoodEntry[]): Array<[string, number]> {
  const counts = new Map<string, number>();
  entries.forEach((entry) => entry.moods.forEach((mood) => counts.set(mood, (counts.get(mood) ?? 0) + 1)));
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/** Distinct calendar days with at least one check-in. */
export function checkInDays(entries: MoodEntry[]): number {
  return new Set(entries.map((entry) => dayjs(entry.date).format("YYYY-MM-DD"))).size;
}

/** Weather snapshot condition at check-in, when one was captured. */
function weatherOf(entry: MoodEntry): { description?: string; iconCode?: string } | null {
  if (!entry.weatherSnapshot) return null;
  try { return JSON.parse(entry.weatherSnapshot) as { description?: string; iconCode?: string }; } catch { return null; }
}

/** One "What shapes your energy" row: how much higher or lower energy runs when the factor is present. */
export interface EnergyFactor { key: "clear-sky" | "music" | "photo" | "late-night"; label: string; delta: number; withCount: number }

/**
 * Compares average energy with and without each factor. A factor appears only when both groups have at
 * least {@link MIN_FACTOR_SAMPLE} check-ins, so a single entry never becomes a "pattern". Weather rows
 * compare only entries that captured weather, since entries without a snapshot say nothing about the sky.
 */
export function energyFactors(entries: MoodEntry[], moods: MoodDefinition[]): EnergyFactor[] {
  const withWeather = entries.filter((entry) => weatherOf(entry));
  const isClear = (entry: MoodEntry) => {
    const weather = weatherOf(entry);
    return !!weather && (/clear/i.test(weather.description ?? "") || (weather.iconCode ?? "").startsWith("01"));
  };
  const isLateNight = (entry: MoodEntry) => { const hour = loggedAt(entry).hour(); return hour >= 22 || hour < 4; };
  const candidates: Array<[EnergyFactor["key"], string, MoodEntry[], (entry: MoodEntry) => boolean]> = [
    ["clear-sky", "Clear-sky days", withWeather, isClear],
    ["music", "Entries with music", entries, (entry) => !!entry.musicTrack],
    ["photo", "Entries with a photo", entries, (entry) => (entry.photoCount ?? 0) > 0],
    ["late-night", "Late-night check-ins", entries, isLateNight],
  ];
  return candidates.flatMap(([key, label, pool, matches]) => {
    const yes = pool.filter(matches);
    const no = pool.filter((entry) => !matches(entry));
    if (yes.length < MIN_FACTOR_SAMPLE || no.length < MIN_FACTOR_SAMPLE) return [];
    return [{ key, label, delta: (averageEnergy(yes, moods) ?? 0) - (averageEnergy(no, moods) ?? 0), withCount: yes.length }];
  });
}

/** Parts of the day used for the liveliest time, by local logged hour. */
const DAY_PARTS = [
  { name: "Morning", range: "5 – 11 AM", test: (hour: number) => hour >= 5 && hour < 12 },
  { name: "Afternoon", range: "12 – 5 PM", test: (hour: number) => hour >= 12 && hour < 17 },
  { name: "Evening", range: "5 – 10 PM", test: (hour: number) => hour >= 17 && hour < 22 },
  { name: "Late night", range: "10 PM – 5 AM", test: (hour: number) => hour >= 22 || hour < 5 },
];

/**
 * The part of the day whose check-ins carry the highest average energy, from each entry's logged time.
 * Parts with fewer than {@link MIN_TIME_SAMPLE} check-ins are ignored; returns null when none qualify.
 */
export function liveliestTime(entries: MoodEntry[], moods: MoodDefinition[]): { name: string; range: string; count: number } | null {
  const scored = DAY_PARTS.map((part) => {
    const partEntries = entries.filter((entry) => part.test(loggedAt(entry).hour()));
    return { ...part, count: partEntries.length, energy: averageEnergy(partEntries, moods) ?? 0 };
  }).filter((part) => part.count >= MIN_TIME_SAMPLE).sort((a, b) => b.energy - a.energy || b.count - a.count);
  return scored[0] ? { name: scored[0].name, range: scored[0].range, count: scored[0].count } : null;
}
