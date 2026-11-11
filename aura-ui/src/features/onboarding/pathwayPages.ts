import type { SpiritualPathway } from "@/features/auth/models/SpiritualPathway";

/** A selectable chip on a pathway page; `key` matches the API's PathwayPreferences allow-list. */
export interface PathwayChoice {
  key: string;
  label: string;
}

/**
 * Choices offered on the page after the reveal (spec "Pathway pages"). Keys mirror
 * `PathwayPreferences.AllowedFocus` in the API; keep both lists in sync.
 */
export const PATHWAY_FOCUS: Record<SpiritualPathway, readonly PathwayChoice[]> = {
  Energy: [
    { key: "moon-phases", label: "Moon phases" },
    { key: "my-sign", label: "My sign" },
    { key: "chakras", label: "Chakras" },
    { key: "crystals", label: "Crystals" },
  ],
  Faith: [
    { key: "verse", label: "A verse" },
    { key: "prayer", label: "A short prayer" },
    { key: "reflection-question", label: "A reflection question" },
  ],
  Mindfulness: [
    { key: "calm", label: "Calm" },
    { key: "rest", label: "Rest" },
    { key: "clarity", label: "Clarity" },
    { key: "gratitude", label: "Gratitude" },
    { key: "self-kindness", label: "Self-kindness" },
    { key: "focus", label: "Focus" },
  ],
};

/** Mindful Living check-in openers; mirrors `PathwayPreferences.AllowedOpeners`. */
export const CHECK_IN_OPENERS: readonly PathwayChoice[] = [
  { key: "none", label: "Nothing" },
  { key: "three-breaths", label: "3 breaths" },
  { key: "one-minute", label: "1 minute" },
];

/** Mindful Living asks for one or two intentions (API `MaxMindfulIntentions`). */
export const MAX_MINDFUL_INTENTIONS = 2;

/** Toggles `key` in `selected`, honoring the Mindful Living two-intention cap. */
export function toggleFocus(pathway: SpiritualPathway, selected: readonly string[], key: string): string[] {
  if (selected.includes(key)) return selected.filter((k) => k !== key);
  if (pathway === "Mindfulness" && selected.length >= MAX_MINDFUL_INTENTIONS) return [...selected];
  return [...selected, key];
}

/** Western sun sign and element for a birthday (YYYY-MM-DD), used on the birthday card and "Your sky". */
export function sunSign(isoDate: string): { sign: string; element: "Fire" | "Earth" | "Air" | "Water" } | undefined {
  const match = /^\d{4}-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return undefined;
  const md = Number(match[1]) * 100 + Number(match[2]);
  // Each entry: [last month-day of the sign, sign, element]; Capricorn wraps the year end.
  const table: Array<[number, string, "Fire" | "Earth" | "Air" | "Water"]> = [
    [119, "Capricorn", "Earth"], [218, "Aquarius", "Air"], [320, "Pisces", "Water"], [419, "Aries", "Fire"],
    [520, "Taurus", "Earth"], [620, "Gemini", "Air"], [722, "Cancer", "Water"], [822, "Leo", "Fire"],
    [922, "Virgo", "Earth"], [1022, "Libra", "Air"], [1121, "Scorpio", "Water"], [1221, "Sagittarius", "Fire"],
    [1231, "Capricorn", "Earth"],
  ];
  const hit = table.find(([end]) => md <= end);
  return hit ? { sign: hit[1], element: hit[2] } : undefined;
}

/** Element base hue for Astrology & Energy (spec §6). */
export const ELEMENT_HUE: Record<"Fire" | "Earth" | "Air" | "Water", { hue: number; name: string }> = {
  Fire: { hue: 40, name: "Ember orange" },
  Earth: { hue: 130, name: "Moss green" },
  Air: { hue: 95, name: "Pale gold" },
  Water: { hue: 220, name: "Deep teal-blue" },
};
