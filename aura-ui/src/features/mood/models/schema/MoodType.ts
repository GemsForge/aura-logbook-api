/** Stable identifier for a mood definition returned by the reference-data API. */
export type MoodType = string;

/** Legacy quick-check-in order; new form choices are sourced from the reference-data API. */
export const MoodTypes: MoodType[] = [
  "Empowered", "Centered", "Harmonious", "Flowing", "Weary", "Tense",
  "Frustrated", "Restless", "Disconnected", "Heavy", "Charged", "Scattered",
  "Abundant", "Visionary", "Neutral",
];
