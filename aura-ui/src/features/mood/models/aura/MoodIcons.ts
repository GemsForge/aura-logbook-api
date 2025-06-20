import type { MoodType } from "../schema/MoodType";
export const MoodIcons: Record<MoodType, string> = {
  Joyful: "😄",
  Content: "😊",
  Peaceful: "🕊️",
  Motivated: "🚀",
  Tired: "😴",
  Stressed: "😣",
  Frustrated: "😤",
  Anxious: "😰",
  Lonely: "😔",
  Sad: "😢",
  Angry: "😠",
  Overwhelmed: "🤯",
  Grateful: "🙏",
  Hopeful: "🌈",
  Meh: "😐",
} as const;

export type MoodIcon = (typeof MoodIcons)[MoodType];
