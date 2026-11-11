import { describe, expect, it } from "vitest";
import { testAuraDefinitions } from "../test/testUtilities";
import {
  getAccessibleTextColor,
  getAuraColorPreview,
  getAuraShade,
  normalizeAuraIntensity,
  resolveAuraColor,
} from "./auraTheme";

describe("database-backed aura palettes", () => {
  it("uses the first active definition for an unknown stored key", () => {
    expect(resolveAuraColor("unknown", testAuraDefinitions)?.key).toBe("blue");
    expect(getAuraColorPreview("unknown", 50, testAuraDefinitions)).toBe("#2196f3");
  });

  it("resolves an active key without depending on casing", () => {
    expect(resolveAuraColor(" GREEN ", testAuraDefinitions)?.key).toBe("green");
    expect(getAuraColorPreview("GREEN", 70, testAuraDefinitions)).toBe("#388e3c");
  });

  it.each([[0, 100], [50, 500], [100, 900], [70, 700]])(
    "maps intensity %s to palette shade %s",
    (intensity, shade) => expect(getAuraShade(intensity)).toBe(shade),
  );

  it("normalizes legacy intensities and selects accessible text contrast", () => {
    expect(normalizeAuraIntensity(500)).toBe(50);
    expect(normalizeAuraIntensity(700)).toBe(70);
    expect(getAccessibleTextColor("#ffffff")).toBe("#000000");
    expect(getAccessibleTextColor("#000000")).toBe("#ffffff");
  });
});
