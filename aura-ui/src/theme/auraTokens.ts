/**
 * Text-safe aura tokens (#344, docs/ux/onboarding-aura-spec.md §8). The derived aura is an OKLCH
 * hue/chroma; this turns it into concrete colors for tints, surfaces, buttons and text, clamping to
 * the sRGB gamut and stepping lightness until each pairing meets WCAG contrast. The raw aura hue is
 * never used directly on text.
 */

export type ThemeMode = "light" | "dark";

/** Concrete aura colors for one interface mode. */
export interface AuraTokens {
  /** Backgrounds and calendar cells. */
  tint: string;
  /** Orb and card surfaces. */
  surface: string;
  /** Button fill. */
  accent: string;
  /** Text on `accent` (≥ 4.5:1). */
  onAccent: string;
  /** Links and emphasis on the page canvas (≥ 4.5:1). */
  text: string;
}

type Rgb = [number, number, number];

/** OKLCH → linear sRGB (Björn Ottosson's OKLab matrices). */
function oklchToLinear(l: number, c: number, hDeg: number): Rgb {
  const h = (hDeg * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

const inGamut = (rgb: Rgb) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

/** OKLCH → linear sRGB, reducing chroma until the color fits the sRGB gamut. */
export function oklchToLinearInGamut(l: number, c: number, h: number): Rgb {
  let chroma = c;
  let rgb = oklchToLinear(l, chroma, h);
  while (!inGamut(rgb) && chroma > 0) {
    chroma = Math.max(0, chroma - 0.005);
    rgb = oklchToLinear(l, chroma, h);
  }
  return rgb.map((v) => Math.min(1, Math.max(0, v))) as Rgb;
}

const toGamma = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

/** Linear sRGB → #rrggbb. */
export function linearToHex(rgb: Rgb): string {
  return "#" + rgb.map((v) => Math.round(toGamma(v) * 255).toString(16).padStart(2, "0")).join("");
}

/** #rrggbb → linear sRGB. */
export function hexToLinear(hex: string): Rgb {
  const n = hex.replace("#", "");
  return [0, 2, 4].map((i) => toLinear(parseInt(n.slice(i, i + 2), 16) / 255)) as Rgb;
}

/** WCAG relative luminance of a hex color. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToLinear(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colors. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const hexAt = (l: number, c: number, h: number) => linearToHex(oklchToLinearInGamut(l, c, h));

/** Steps lightness from `start` by `step` until the color reaches `ratio` against `against`. */
function stepUntil(start: number, step: number, c: number, h: number, against: string, ratio: number): string {
  for (let l = start; l >= 0 && l <= 1; l += step) {
    const hex = hexAt(l, c, h);
    if (contrast(hex, against) >= ratio) return hex;
  }
  return step < 0 ? "#000000" : "#ffffff";
}

/**
 * Derives aura tokens for `mode`, checked against the theme's page `canvas` color.
 * @param hue OKLCH hue in degrees from `GET /api/aura/current`.
 * @param chroma OKLCH chroma from the same response.
 * @param canvas The interface theme's canvas color (#rrggbb).
 */
export function deriveAuraTokens(hue: number, chroma: number, mode: ThemeMode, canvas: string): AuraTokens {
  const light = mode === "light";
  const tint = hexAt(light ? 0.95 : 0.25, chroma * (light ? 0.3 : 0.4), hue);
  const surface = hexAt(light ? 0.72 : 0.6, chroma, hue);
  // Accent must also be visible against the canvas as a UI component (≥ 3:1).
  const accent = stepUntil(light ? 0.55 : 0.7, light ? -0.03 : 0.03, chroma, hue, canvas, 3);
  const onAccent = contrast("#ffffff", accent) >= contrast("#141414", accent) ? "#ffffff" : "#141414";
  const text = stepUntil(light ? 0.45 : 0.8, light ? -0.03 : 0.03, chroma, hue, canvas, 4.5);
  return { tint, surface, accent, onAccent, text };
}
