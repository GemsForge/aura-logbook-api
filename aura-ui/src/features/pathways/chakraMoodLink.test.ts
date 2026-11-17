import { describe, expect, it } from "vitest";
import type { MoodEntry } from "@/features/mood/models/schema";
import type { ChakraDefinition } from "@/store/referenceDataApi";
import { chakraDaysSince, latestEntry, linkMoodsToChakras, type ChakraLinkReference } from "./chakraMoodLink";

const chakra = (key: string, displayName: string) => ({ key, displayName } as ChakraDefinition);
const reference: ChakraLinkReference = {
  chakras: [chakra("heart", "Heart"), chakra("throat", "Throat"), chakra("third-eye", "Third Eye")],
  auras: [
    { key: "green", displayName: "Green", baseHex: "#3a7", chakraKey: "heart", description: "", isNeutral: false },
    { key: "blue", displayName: "Blue", baseHex: "#37a", chakraKey: "throat", description: "", isNeutral: false },
    { key: "indigo", displayName: "Indigo", baseHex: "#435", chakraKey: "third_eye", description: "", isNeutral: false },
    { key: "gray", displayName: "Gray", baseHex: "#888", chakraKey: null, description: "", isNeutral: true },
  ],
  moods: [
    { key: "Calm", displayName: "Calm", auraColorKeys: ["green"], description: "", sortOrder: 1, icon: "" },
    { key: "Expressive", displayName: "Expressive", auraColorKeys: ["blue", "indigo", "green"], description: "", sortOrder: 2, icon: "" },
    { key: "Neutral", displayName: "Neutral", auraColorKeys: ["gray"], description: "", sortOrder: 3, icon: "" },
  ],
};
const entry = (date: string, moods: string[], createdAt = `${date}T10:00:00Z`) => ({ id: 1, userId: 1, date, moods, createdAt } as MoodEntry);

describe("linkMoodsToChakras", () => {
  it("maps a mood's aura color to its chakra", () => {
    const [link] = linkMoodsToChakras(["calm"], reference);
    expect(link).toMatchObject({ moodName: "Calm", auraName: "Green", chakra: { key: "heart" } });
  });

  it("handles multiple colors, normalizes legacy keys, and caps the list", () => {
    expect(linkMoodsToChakras(["Expressive"], reference).map((link) => link.chakra.key)).toEqual(["throat", "third-eye"]);
    expect(linkMoodsToChakras(["Expressive"], reference, 5)).toHaveLength(3);
  });

  it("skips unmapped colors and unknown moods without error", () => {
    expect(linkMoodsToChakras(["Neutral", "Unknown"], reference)).toEqual([]);
  });
});

describe("check-in helpers", () => {
  it("returns no latest entry when there are no check-ins", () => {
    expect(latestEntry([])).toBeUndefined();
    expect(chakraDaysSince([], "2026-01-01", reference).size).toBe(0);
  });

  it("picks the most recent check-in and counts distinct days per chakra", () => {
    const entries = [entry("2026-01-02", ["Calm"]), entry("2026-01-03", ["Calm"], "2026-01-03T08:00:00Z"), entry("2026-01-03", ["Expressive"], "2026-01-03T20:00:00Z"), entry("2025-12-20", ["Calm"])];
    expect(latestEntry(entries)?.moods).toEqual(["Expressive"]);
    expect(Object.fromEntries(chakraDaysSince(entries, "2026-01-01", reference))).toEqual({ heart: 2, throat: 1, "third-eye": 1 });
  });
});
