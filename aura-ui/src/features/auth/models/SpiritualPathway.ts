export type SpiritualPathway = "Mindfulness" | "Energy" | "Faith";

export const SpiritualPathway = {
  Mindfulness: "Mindfulness" as SpiritualPathway,
  Energy: "Energy" as SpiritualPathway,
  Faith: "Faith" as SpiritualPathway,
};

// Add descriptions for tooltips/help text
export const SpiritualPathwayDescriptions: Record<SpiritualPathway, string> = {
  Mindfulness: "Calm, clarity, and self-awareness.",
  Energy: "For those drawn to star signs and energy.",
  Faith: "For reflection shaped by personal beliefs, meaningful traditions, values, community, or sacred texts.",
};

/**
 * Resolves a stored pathway value (enum key or display label, any case) to its enum key.
 * Returns undefined for unknown values so callers choose their own fallback.
 */
export function normalizeSpiritualPathway(value?: string | null): SpiritualPathway | undefined {
  switch (value?.trim().toLowerCase()) {
    case "mindfulness":
    case "mindful living":
      return "Mindfulness";
    case "energy":
    case "astrology & energy":
      return "Energy";
    case "faith":
    case "faith & religion":
    case "christian faith":
      return "Faith";
    default:
      return undefined;
  }
}
