import dayjs from "dayjs";
import type { MoodEntry, MoodType } from "./models/schema";
import type { MoodDefinition } from "@/store/referenceDataApi";

export interface WeekMoodDay {
  date: string;
  label: string;
  mood: MoodType | null;
  auraColor: string | null;
  entryCount: number;
}

/** Builds seven labeled daily summaries from entries without treating empty days as missed goals. */
export function buildWeekMoodStrip(entries: MoodEntry[], referenceDate: Date = new Date(), moodDefinitions: MoodDefinition[] = []): WeekMoodDay[] {
  const today = dayjs(referenceDate).startOf("day");
  return Array.from({ length: 7 }, (_, index) => {
    const day = today.subtract(6 - index, "day");
    const date = day.format("YYYY-MM-DD");
    const dayEntries = entries.filter((entry) => dayjs(entry.date).format("YYYY-MM-DD") === date);
    const counts = new Map<MoodType, number>();
    dayEntries.forEach((entry) => entry.moods.forEach((mood) => counts.set(mood, (counts.get(mood) ?? 0) + 1)));
    const mood = [...counts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0] ?? null;
    return {
      date,
      label: day.format("ddd"),
      mood,
      auraColor: mood ? moodDefinitions.find((definition) => definition.key === mood)?.auraColorKeys[0] ?? null : null,
      entryCount: dayEntries.length,
    };
  });
}

/** Returns one factual weekly sentence, with thresholds based on this week's saved entries. */
export function summarizeMoodPatterns(entries: MoodEntry[], referenceDate: Date = new Date(), moodDefinitions: MoodDefinition[] = []): string {
  const week = buildWeekMoodStrip(entries, referenceDate, moodDefinitions);
  const weekDates = new Set(week.map(({ date }) => date));
  const weeklyEntries = entries.filter((entry) => weekDates.has(dayjs(entry.date).format("YYYY-MM-DD")));
  if (weeklyEntries.length < 3) return "Log a few more days to see your patterns.";

  const moodCounts = new Map<MoodType, number>();
  weeklyEntries.forEach((entry) => entry.moods.forEach((mood) => moodCounts.set(mood, (moodCounts.get(mood) ?? 0) + 1)));
  const [topMood, topMoodCount] = [...moodCounts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0];
  // If no mood repeated, naming an alphabetical "winner" would overstate the data.
  if (topMoodCount === 1 && moodCounts.size > 1) return "No single mood stood out this week.";
  let sentence = `${topMood} appeared most often this week (${topMoodCount} ${topMoodCount === 1 ? "check-in" : "check-ins"}).`;

  if (weeklyEntries.length >= 6) {
    const weekdayCounts = new Map<string, number>();
    weeklyEntries.forEach((entry) => {
      const weekday = dayjs(entry.date).format("dddd");
      weekdayCounts.set(weekday, (weekdayCounts.get(weekday) ?? 0) + 1);
    });
    const highestCount = Math.max(...weekdayCounts.values());
    const weekdays = [...weekdayCounts.entries()].filter(([, count]) => count === highestCount).map(([weekday]) => weekday);
    sentence = `${sentence.slice(0, -1)}; your check-ins were most often on ${weekdays.join(" and ")}.`;
  }

  return sentence;
}
