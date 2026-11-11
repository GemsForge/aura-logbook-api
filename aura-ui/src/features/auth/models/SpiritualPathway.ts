/** Stable key for a database-backed spiritual pathway definition. */
export type SpiritualPathway = string;

/** Resolves legacy pathway labels while new selections use stable database keys. */
export function normalizeSpiritualPathway(value?: string | null): SpiritualPathway | undefined {
  switch (value?.trim().toLowerCase()) {
    case "mindfulness": case "mindful living": return "mindfulness";
    case "energy": case "astrology & energy": return "energy";
    case "faith": case "faith & religion": case "christian faith": return "faith";
    default: return undefined;
  }
}
