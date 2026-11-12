import { describe, expect, it } from "vitest";
import type { MoodEntry } from "@/features/mood/models/schema";
import type { MoodDefinition } from "@/store/referenceDataApi";
import { averageEnergy, energyFactors, entriesInRange, liveliestTime, periodRange, ribbonPoints, topMood } from "./insightMetrics";

const moods = [
  { key: "Weary", energyLevel: 1 },
  { key: "Centered", energyLevel: 3 },
  { key: "Empowered", energyLevel: 5 },
] as MoodDefinition[];
const today = new Date(2026, 10, 11, 20, 0);
let id = 0;
/** Builds an entry logged at a local date and hour. */
const entry = (date: string, hour: number, mood: string, extra: Partial<MoodEntry> = {}): MoodEntry =>
  ({ id: ++id, userId: 1, date, moods: [mood], createdAt: new Date(`${date}T${String(hour).padStart(2, "0")}:00:00`).toISOString(), ...extra }) as MoodEntry;

describe("insightMetrics", () => {
  it("scopes week, month, and year to the expected days", () => {
    expect(periodRange("week", today).label).toBe("Nov 5 – 11");
    expect(periodRange("month", today).elapsedDays).toBe(11);
    expect(periodRange("year", today).label).toBe("2026");
    const entries = [entry("2026-11-04", 9, "Weary"), entry("2026-11-05", 9, "Centered")];
    expect(entriesInRange(entries, periodRange("week", today))).toHaveLength(1);
  });

  it("averages energy and finds the top mood", () => {
    const entries = [entry("2026-11-10", 9, "Weary"), entry("2026-11-11", 9, "Empowered"), entry("2026-11-11", 18, "Empowered")];
    expect(averageEnergy(entries, moods)).toBeCloseTo(11 / 3);
    expect(topMood(entries)).toEqual({ mood: "Empowered", count: 2, total: 3 });
  });

  it("plots every weekly check-in and leaves empty days as gaps", () => {
    const points = ribbonPoints("week", [entry("2026-11-11", 9, "Weary"), entry("2026-11-11", 18, "Empowered")], periodRange("week", today), moods);
    expect(points.filter((point) => point.energy === null)).toHaveLength(6);
    expect(points.filter((point) => point.energy !== null).map((point) => point.energy)).toEqual([1, 5]);
  });

  it("shows a factor only with enough check-ins on both sides", () => {
    const clear = JSON.stringify({ description: "clear sky", iconCode: "01d" });
    const cloudy = JSON.stringify({ description: "overcast", iconCode: "04d" });
    const entries = [
      entry("2026-11-08", 9, "Empowered", { weatherSnapshot: clear, photoCount: 1 }),
      entry("2026-11-09", 9, "Empowered", { weatherSnapshot: clear }),
      entry("2026-11-10", 9, "Weary", { weatherSnapshot: cloudy }),
      entry("2026-11-11", 9, "Weary", { weatherSnapshot: cloudy }),
    ];
    const factors = energyFactors(entries, moods);
    expect(factors.find((factor) => factor.key === "clear-sky")?.delta).toBe(4);
    // One photo is not a pattern; no music was captured at all.
    expect(factors.map((factor) => factor.key)).not.toContain("photo");
    expect(factors.map((factor) => factor.key)).not.toContain("music");
  });

  it("names the liveliest part of the day only with three or more check-ins there", () => {
    const evening = [entry("2026-11-09", 19, "Empowered"), entry("2026-11-10", 19, "Empowered"), entry("2026-11-11", 19, "Centered")];
    expect(liveliestTime([...evening, entry("2026-11-11", 8, "Weary")], moods)).toEqual({ name: "Evening", range: "5 – 10 PM", count: 3 });
    expect(liveliestTime(evening.slice(0, 2), moods)).toBeNull();
  });
});
