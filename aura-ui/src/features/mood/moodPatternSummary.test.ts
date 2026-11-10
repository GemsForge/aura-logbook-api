import { describe, expect, it } from "vitest";
import type { MoodEntry, MoodType } from "./models/schema";
import { buildWeekMoodStrip, summarizeMoodPatterns } from "./moodPatternSummary";

const today = new Date("2026-11-10T12:00:00");
const makeEntries = (moodsByDate: Array<[string, MoodType[]]>): MoodEntry[] =>
  moodsByDate.map(([date, moods], index) => ({ id: index + 1, userId: 1, date, moods, comment: "", createdAt: `${date}T12:00:00` }));

describe("moodPatternSummary", () => {
  it.each([0, 2])("uses the sparse-data line with %i weekly entries", (count) => {
    const entries = makeEntries(Array.from({ length: count }, (_, index) => [`2026-11-${String(10 - index).padStart(2, "0")}`, ["Centered"]] as [string, MoodType[]]));
    expect(summarizeMoodPatterns(entries, today)).toBe("Log a few more days to see your patterns.");
  });

  it("reports the most frequent mood at three and five entries without a weekday claim", () => {
    for (const count of [3, 5]) {
      const entries = makeEntries(Array.from({ length: count }, (_, index) => [`2026-11-${String(10 - index).padStart(2, "0")}`, [index < Math.ceil(count / 2) ? "Centered" : "Empowered"]] as [string, MoodType[]]));
      expect(summarizeMoodPatterns(entries, today)).toBe(`Centered appeared most often this week (${Math.ceil(count / 2)} check-ins).`);
    }
  });

  it("adds a weekday observation at six entries and handles ties deterministically", () => {
    const entries = makeEntries([
      ["2026-11-10", ["Centered"]], ["2026-11-09", ["Empowered"]], ["2026-11-08", ["Centered"]],
      ["2026-11-07", ["Empowered"]], ["2026-11-06", ["Centered"]], ["2026-11-05", ["Empowered"]],
    ]);
    const summary = summarizeMoodPatterns(entries, today);
    expect(summary).toContain("Centered appeared most often this week (3 check-ins)");
    expect(summary).toContain("check-ins were most often on");
    expect(summary).not.toContain("because");
  });

  it("labels all seven days and keeps empty days explicit", () => {
    const entries = makeEntries([["2026-11-10", ["Tense"]]]);
    const strip = buildWeekMoodStrip(entries, today);
    expect(strip).toHaveLength(7);
    expect(strip[6]).toMatchObject({ date: "2026-11-10", mood: "Tense", auraColor: "red", entryCount: 1 });
    expect(strip.slice(0, 6).every(({ mood, auraColor }) => mood === null && auraColor === null)).toBe(true);
  });
});
