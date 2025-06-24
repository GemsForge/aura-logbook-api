import type { MoodType } from "../schema/MoodType";

export const MoodIcons: Record<MoodType, string> = {
  Empowered: "😄", // Joyful
  Centered: "😊", // Content
  Harmonious: "🕊️", // Peaceful
  Flowing: "🚀", // Motivated
  Weary: "😴", // Tired → Weary
  Tense: "😣", // Stressed
  Blocked: "😤", // Frustrated
  Restless: "😰", // Anxious
  Disconnected: "😔", // Lonely
  Heavy: "😢", // Sad
  Charged: "😠", // Angry
  Scattered: "🤯", // Overwhelmed
  Abundant: "🙏", // Grateful
  Visionary: "🌈", // Hopeful
  Neutral: "😐", // Meh
} as const;

export type MoodIcon = (typeof MoodIcons)[MoodType];
