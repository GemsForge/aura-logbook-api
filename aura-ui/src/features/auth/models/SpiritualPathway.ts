export type SpiritualPathway =
  | "Secular"
  | "Mindfulness"
  | "Astrology"
  | "Chakra"
  | "Christian";

export const SpiritualPathway = {
  Secular: "Secular" as SpiritualPathway,
  Mindfulness: "Mindfulness" as SpiritualPathway,
  Astrology: "Astrology" as SpiritualPathway,
  Chakra: "Chakra" as SpiritualPathway,
  Christian: "Christian" as SpiritualPathway,
};

// Add descriptions for tooltips/help text
export const SpiritualPathwayDescriptions: Record<SpiritualPathway, string> = {
  Secular: "Focus on science-based, non-spiritual mood insights.",
  Mindfulness: "Enhance self-awareness with mindful practices.",
  Astrology: "Reflect through zodiac cycles and planetary influence.",
  Chakra: "Explore your energy centers and aura colors.",
  Christian: "Find guidance with Bible-based spiritual context.",
};
