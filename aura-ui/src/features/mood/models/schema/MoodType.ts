// src/features/mood/models/MoodType.ts

/**
 * Union type representing allowed mood values.
 */
export type MoodType =
  | "Empowered"      // Joyful: personal power & confidence
  | "Centered"       // Content: inner balance & compassion
  | "Harmonious"     // Peaceful: clear expression & calm
  | "Flowing"        // Motivated: creative flow & inspiration
  | "Weary"       // Tired: need for rest & stability
  | "Tense"          // Stressed: survival tension
  | "Blocked"        // Frustrated: stuck energy
  | "Restless"       // Anxious: overactive mind
  | "Disconnected"   // Lonely: closed-off heart
  | "Heavy"          // Sad: emotional heaviness
  | "Charged"        // Angry: fiery drive
  | "Scattered"      // Overwhelmed: scattered roots
  | "Abundant"       // Grateful: sense of plenty
  | "Visionary"      // Hopeful: big-picture optimism
  | "Neutral";       // Meh: reset & neutrality


/**
 * List of mood types as an array (for dropdowns, loops, etc.)
 */
export const MoodTypes: MoodType[] = [
  "Empowered",
  "Centered",
  "Harmonious",
  "Flowing",
  "Weary",
  "Tense",
  "Blocked",
  "Restless",
  "Disconnected",
  "Heavy",
  "Charged",
  "Scattered",
  "Abundant",
  "Visionary",
  "Neutral",
];
