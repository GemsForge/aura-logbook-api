/** Stable key for a database-backed spiritual pathway definition. */
export type SpiritualPathway = string;

/** Compatibility values for persisted keys; UI choices and copy come from reference data. */
export const SpiritualPathway = { Mindfulness: "mindfulness", Energy: "energy", Faith: "faith" } as const;

/** Legacy display fallback retained for profile surfaces outside the reference-data transition. */
export const SpiritualPathwayDescriptions: Record<string, string> = {
  mindfulness: "Calm, clarity, and self-awareness.",
  energy: "For those drawn to star signs and energy.",
  faith: "For reflection shaped by personal beliefs, meaningful traditions, values, community, or sacred texts.",
};

/** Resolves legacy pathway labels while new selections use stable database keys. */
export function normalizeSpiritualPathway(value?: string | null): SpiritualPathway | undefined {
  switch (value?.trim().toLowerCase()) {
    case "mindfulness": case "mindful living": return "mindfulness";
    case "energy": case "astrology & energy": return "energy";
    case "faith": case "faith & religion": case "christian faith": return "faith";
    default: return undefined;
  }
}
