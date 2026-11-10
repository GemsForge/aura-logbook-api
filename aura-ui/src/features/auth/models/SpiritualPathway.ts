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
