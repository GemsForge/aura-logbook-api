import { describe, expect, it } from "vitest";
import { contrast, deriveAuraTokens, hexToLinear, linearToHex } from "./auraTokens";
import { interfaceThemeTokens, interfaceThemes } from "./interfaceThemes";

describe("auraTokens", () => {
  it("round-trips hex through linear sRGB", () => {
    expect(linearToHex(hexToLinear("#7e5d7b"))).toBe("#7e5d7b");
  });

  it("computes WCAG contrast", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrast("#777777", "#777777")).toBeCloseTo(1, 5);
  });

  // #344 acceptance: every hue in every interface theme yields text >= 4.5:1 and UI >= 3:1.
  it.each(interfaceThemes)("keeps every hue readable on the %s theme", (theme) => {
    const { mode, canvas } = interfaceThemeTokens[theme];
    for (let hue = 0; hue < 360; hue++) {
      for (const chroma of [0.04, 0.1, 0.16]) {
        const t = deriveAuraTokens(hue, chroma, mode, canvas);
        expect(contrast(t.text, canvas), `text ${theme} ${hue}/${chroma}`).toBeGreaterThanOrEqual(4.5);
        expect(contrast(t.onAccent, t.accent), `on-accent ${theme} ${hue}/${chroma}`).toBeGreaterThanOrEqual(4.5);
        expect(contrast(t.accent, canvas), `accent ${theme} ${hue}/${chroma}`).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
