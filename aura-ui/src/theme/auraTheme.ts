import type { AuraColorDefinition } from "@/features/mood/models/aura";

export type ShadeKey = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

/** CSS-variable palette adapter; shade values are installed from the active database definitions. */
export const auraPalettes: Record<string, Record<ShadeKey | "primary", { main: string }>> = new Proxy({}, {
  get: (_target, key) => {
    const color = String(key);
    const palette = Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => [shade, { main: `var(--aura-palette-${color}-${shade})` }]));
    return { ...palette, primary: { main: `var(--aura-palette-${color}-500)` } };
  },
});

/** Normalize persisted aura intensity values to the current 0-100 contract. */
export function normalizeAuraIntensity(intensity: unknown): number {
  const value = typeof intensity === "number" ? intensity : Number(intensity);
  if (!Number.isFinite(value)) return 50;
  if (value >= 0 && value <= 100) return Math.round(value);
  if (value >= 100 && value <= 900 && value % 100 === 0) return value / 10;
  return 50;
}

/** Resolve intensity to the closest palette shade supplied by the API. */
export function getAuraShade(intensity: unknown): ShadeKey {
  const normalized = normalizeAuraIntensity(intensity);
  return (100 + Math.round((normalized / 100) * 8) * 100) as ShadeKey;
}

/** Resolve an unknown persisted key to an active API definition. */
export function resolveAuraColor(
  color: unknown,
  definitions: AuraColorDefinition[],
): AuraColorDefinition | undefined {
  if (typeof color === "string") {
    const match = definitions.find((definition) => definition.key === color.trim().toLowerCase());
    if (match) return match;
  }
  return definitions[0];
}

/** Select a database-provided shade for previews and contextual accents. */
export function getAuraColorPreview(
  color: unknown,
  intensity: unknown,
  definitions: AuraColorDefinition[],
): string {
  const definition = resolveAuraColor(color, definitions);
  if (!definition) return "transparent";
  return definition.shades?.[getAuraShade(intensity)] ?? definition.baseHex;
}

/** Pick the darkest or lightest text color that provides stronger contrast. */
export function getAccessibleTextColor(background: string): string {
  if (!/^#[0-9a-f]{6}$/i.test(background)) return "#000000";
  const channels = [1, 3, 5].map((offset) => Number.parseInt(background.slice(offset, offset + 2), 16) / 255);
  const luminance = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  return luminance > 0.179 ? "#000000" : "#ffffff";
}
