import { describe, expect, it } from "vitest";
import { energyPatternReflection } from "./useDailyPathwayReflection";
import { testReferenceData } from "@/test/referenceDataFixtures";
import type { MoodEntry } from "@/features/mood/models/schema/MoodEntry";

const reference = { ...testReferenceData, chakras: [{ ...testReferenceData.chakras[0], key: "root", displayName: "Root", sanskritName: "Mūlādhāra", interpretiveTheme: "Grounding", moodAssociationKeys: ["Scattered", "Tense"] }] };
/** Synthetic check-ins keep the distinct-day threshold independent of personal account data. */
const entry = (date: string, moods = ["Scattered"]): MoodEntry => ({ id: 1, userId: 1, date, moods, createdAt: `${date}T12:00:00Z` });

describe("energyPatternReflection", () => {
  it("requires three distinct matching days, rather than three entries on one day", () => {
    expect(energyPatternReflection(reference, [entry("2026-11-13"), entry("2026-11-13"), entry("2026-11-13")], "2026-11-13")).toBeUndefined();
  });
  it("counts only matching dates within the inclusive two-week window and names only recorded moods", () => {
    const result = energyPatternReflection(reference, [entry("2026-10-30"), entry("2026-10-31"), entry("2026-11-02"), entry("2026-11-13"), entry("2026-11-14"), entry("2026-11-12", ["Centered"])], "2026-11-13");
    expect(result?.text).toContain("scattered on 3 different days");
    expect(result?.text).not.toContain("tense");
    expect(result?.text).toContain("Mūlādhāra (Root)");
    expect(result?.pathway).toBe("energy");
  });
  it("does not treat a legacy alias as an additional chakra center", () => {
    const legacy = { ...reference, chakras: [{ ...reference.chakras[0], key: "solar_plexus" }] };
    expect(energyPatternReflection(legacy, [entry("2026-11-01"), entry("2026-11-02"), entry("2026-11-03")], "2026-11-13")).toBeUndefined();
  });
  it("does not create a pattern when references or matching days are unavailable", () => {
    expect(energyPatternReflection(undefined, [], "2026-11-13")).toBeUndefined();
    expect(energyPatternReflection(reference, [entry("2026-11-01"), entry("2026-11-02"), entry("2026-11-03", ["Centered"])], "2026-11-13")).toBeUndefined();
  });
});
