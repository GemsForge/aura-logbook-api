import { testReferenceData } from "@/test/referenceDataFixtures";
import { describe, expect, it } from "vitest";
import { hasUsableReferenceData } from "./referenceDataValidation";

describe("reference-data startup validation", () => {
  it("accepts a complete database-provided configuration", () => {
    expect(hasUsableReferenceData(testReferenceData)).toBe(true);
  });

  it("rejects missing theme tokens and incomplete aura palettes", () => {
    expect(hasUsableReferenceData({ ...testReferenceData, themeTokens: [] })).toBe(false);
    const [firstAura, ...otherAuras] = testReferenceData.auras;
    expect(hasUsableReferenceData({
      ...testReferenceData,
      auras: [{ ...firstAura!, shades: { 500: "#2196f3" } }, ...otherAuras],
    })).toBe(false);
  });
});
