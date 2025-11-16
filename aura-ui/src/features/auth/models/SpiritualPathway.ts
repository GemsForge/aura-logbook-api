export type SpiritualPathway = "Mindfulness" | "Energy" | "Faith";

export const SpiritualPathway = {
  Mindfulness: "Mindfulness" as SpiritualPathway,
  Energy: "Energy" as SpiritualPathway,
  Faith: "Faith" as SpiritualPathway,
};

// Add descriptions for tooltips/help text
export const SpiritualPathwayDescriptions: Record<SpiritualPathway, string> = {
  Mindfulness: "Calm, clarity, and self-awareness.",
  // "Focus on self-awareness, calm, and clarity with non-spiritual, mindful practices. Great for those who prefer meditation, journaling, and science-based mental health insights.",
  Energy: "For those drawn to star signs and energy.",
  // "Explore your energy, intuition, and personal insights with guidance from astrology and chakra traditions. Perfect for those drawn to zodiac cycles, spiritual affirmations, and energy color reflection.",
  Faith:
    "For a journey guided by scripture and prayer.",
  // "Experience Christian faith-based reflection with scripture-inspired prompts, prayers, gratitude journaling, and daily Bible verses. Designed for those seeking spiritual growth rooted in Christian tradition.",
};
