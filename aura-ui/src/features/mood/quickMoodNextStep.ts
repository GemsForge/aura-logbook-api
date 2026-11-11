import type { MoodType } from "./models/schema/MoodType";

export type QuickMoodNextStep = { kind: "grounding" | "reflection"; prompt: string };

const groundingMoods = new Set<MoodType>([
  "Weary", "Tense", "Frustrated", "Restless", "Disconnected", "Heavy", "Charged", "Scattered",
]);
const reflectionMoods = new Set<MoodType>(["Empowered", "Centered", "Harmonious", "Flowing", "Abundant", "Visionary"]);

/** Returns one optional, non-clinical prompt for a saved mood, or no prompt when no rule applies. */
export function getQuickMoodNextStep(mood: MoodType, pathwayPrompt?: string): QuickMoodNextStep | null {
  if (groundingMoods.has(mood)) {
    return { kind: "grounding", prompt: "If it feels useful, take one easy breath and name one thing you notice around you." };
  }
  if (reflectionMoods.has(mood)) {
    const prompt = pathwayPrompt?.trim();
    return { kind: "reflection", prompt: prompt || "What would you like to remember about this moment?" };
  }
  return null;
}
