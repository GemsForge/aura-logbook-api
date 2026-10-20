import { describe, expect, it } from "vitest";
import { AuraColor } from "../features/mood/models/aura";
import { auraPalettes, getAuraColorPreview, resolveAuraColor } from "./auraTheme";

describe("aura profile color fallbacks", () => {
  it.each([undefined, null, "unknown", ""])(
    "resolves unsupported color %s to blue",
    (color) => {
      expect(resolveAuraColor(color)).toBe(AuraColor.Blue);
      expect(getAuraColorPreview(color, 500)).toBe(
        auraPalettes[AuraColor.Blue][500].main
      );
    }
  );

  it("accepts supported colors without depending on API casing", () => {
    expect(resolveAuraColor(" GREEN ")).toBe(AuraColor.Green);
    expect(getAuraColorPreview("GREEN", 700)).toBe(
      auraPalettes[AuraColor.Green][700].main
    );
  });

  it.each([undefined, null, 0, 250, 1000])(
    "uses the selected palette primary shade for unsupported intensity %s",
    (intensity) => {
      expect(getAuraColorPreview(AuraColor.Green, intensity)).toBe(
        auraPalettes[AuraColor.Green].primary.main
      );
    }
  );
});
