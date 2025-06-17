// src/features/mood/models/MoodType.ts

/**
 * Union type representing allowed mood values.
 */
export type MoodType =
  | "Joyful"
  | "Content"
  | "Peaceful"
  | "Motivated"
  | "Tired"
  | "Stressed"
  | "Frustrated"
  | "Anxious"
  | "Lonely"
  | "Sad"
  | "Angry"
  | "Overwhelmed"
  | "Grateful"
  | "Hopeful"
  | "Meh";

/**
 * List of mood types as an array (for dropdowns, loops, etc.)
 */
export const MoodTypes: MoodType[] = [
  "Joyful",
  "Content",
  "Peaceful",
  "Motivated",
  "Tired",
  "Stressed",
  "Frustrated",
  "Anxious",
  "Lonely",
  "Sad",
  "Angry",
  "Overwhelmed",
  "Grateful",
  "Hopeful",
  "Meh"
];
