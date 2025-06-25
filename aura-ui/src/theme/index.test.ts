// src/theme/index.test.ts
import { red, blue } from "@mui/material/colors";
import { getAuraTheme } from "./index";
import type { AuraColor } from "../features/mood/models/aura";

describe("getAuraTheme", () => {
  it.each<[AuraColor, number, string]>([
    ["red", 500, red[500]],
    ["red", 700, red[700]],
    ["blue", 300, blue[300]],
    ["blue", 999, blue[500]], // invalid intensity → fallback to 500
  ])("returns %s[%i] for %s with intensity %i", (hue, shade, expected) => {
    const theme = getAuraTheme(hue, shade);
    expect(theme.palette.primary.main).toBe(expected);
  });
});
