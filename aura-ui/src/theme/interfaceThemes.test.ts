import { describe, expect, it } from "vitest";
import { interfaceThemes, interfaceModes, getInterfaceThemeTokens } from "./interfaceThemes";

/** WCAG 2.1 relative luminance of a #RRGGBB color. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two #RRGGBB colors. */
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Guards the #318 accessibility criterion: every theme keeps text at 4.5:1 and control
 * outlines, focus rings, and accents at 3:1 on all three surfaces.
 */
describe.each(interfaceThemes.flatMap((theme) => interfaceModes.map((mode) => [theme, mode] as const)))("%s %s contrast", (theme, mode) => {
  const t = getInterfaceThemeTokens(theme, mode);
  const surfaces = [t.canvas, t.surface, t.surfaceRaised];

  it.each(["ink", "inkMuted", "primary", "danger"] as const)("%s text reaches 4.5:1 on every surface", (token) => {
    for (const surface of surfaces) expect(contrast(t[token], surface)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(["controlBorder", "focus", "accent"] as const)("%s reaches 3:1 on every surface", (token) => {
    for (const surface of surfaces) expect(contrast(t[token], surface)).toBeGreaterThanOrEqual(3);
  });

  it("on-color text reaches 4.5:1 on primary and accent fills", () => {
    expect(contrast(t.primaryContrast, t.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t.primaryContrast, t.accent)).toBeGreaterThanOrEqual(4.5);
  });
});
