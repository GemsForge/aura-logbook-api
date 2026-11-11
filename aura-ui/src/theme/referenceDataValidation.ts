import type { ReferenceDataConfiguration } from "@/store/referenceDataApi";

const REQUIRED_THEME_TOKENS = [
  "color.canvas", "color.surface", "color.ink", "color.inkMuted", "color.line", "color.focus",
  "color.terracotta", "color.surfaceSoft", "color.stone", "font.body", "font.display",
  "radius.control", "radius.card", "radius.shell", "shadow.soft", "shadow.raised",
];

/** Ensures the app has enough active database data to render current choices and themes. */
export function hasUsableReferenceData(data: ReferenceDataConfiguration): boolean {
  const tokenKeys = new Set(data.themeTokens.map((token) => token.key));
  return data.pathways.length > 0 && data.auras.length > 0 && data.moods.length > 0 &&
    REQUIRED_THEME_TOKENS.every((key) => tokenKeys.has(key)) &&
    data.auras.every((aura) => aura.shades && [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].every((shade) => aura.shades?.[shade]));
}
