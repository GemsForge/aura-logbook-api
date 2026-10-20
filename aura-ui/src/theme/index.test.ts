// src/theme/index.test.ts
import { red, blue } from "@mui/material/colors";
import { getAuraJoyTheme, getAuraTheme, prismGarden } from "./index";
import type { AuraColor } from "../features/mood/models/aura";

describe("getAuraTheme", () => {
  it.each<[AuraColor, number, string]>([
    ["red", 50, red[500]],
    ["red", 10, red[200]],
    ["blue", 100, blue[900]],
    ["red", 500, red[500]],
    ["red", 700, red[700]],
    ["blue", 300, blue[300]],
    ["blue", 999, blue[500]], // invalid intensity → fallback to 500
  ])("returns %s[%i] for %s with intensity %i", (hue, shade, expected) => {
    const theme = getAuraTheme(hue, shade);
    expect(theme.palette.primary.main).toBe(expected);
  });
});

describe("Prism Garden foundation", () => {
  it("keeps the warm shell palette independent from the selected aura color", () => {
    const redTheme = getAuraTheme("red", 50);
    const blueTheme = getAuraTheme("blue", 50);

    expect(redTheme.palette.primary.main).not.toBe(blueTheme.palette.primary.main);
    expect(redTheme.palette.background.default).toBe(prismGarden.color.canvas);
    expect(blueTheme.palette.background.default).toBe(prismGarden.color.canvas);
    expect(redTheme.palette.text.primary).toBe(prismGarden.color.ink);
  });

  it("shares Prism Garden surfaces and focus treatment with Joy components", () => {
    const theme = getAuraJoyTheme("blue", 50);

    expect(theme.colorSchemes.light.palette.background.body).toBe(
      prismGarden.color.canvas,
    );
    expect(theme.colorSchemes.light.palette.focusVisible).toBe(
      prismGarden.color.focus,
    );
    expect(theme.fontFamily.display).toContain("Iowan Old Style");
  });
});
