import { type MoodIcon, MoodIcons } from "./MoodIcons";
import { AuraColor } from "./AuraColor";
import type { MoodType } from "../schema/MoodType";

export interface AuraMoodMeta {
  icon: MoodIcon;
  auraColor: AuraColor;
}

export const AuraMoodMap: Record<MoodType, AuraMoodMeta> = {
  Empowered: {
    icon: MoodIcons.Empowered,
    auraColor: AuraColor.Yellow,
  },
  Centered: {
    icon: MoodIcons.Centered,
    auraColor: AuraColor.Yellow,
  },
  Harmonious: {
    icon: MoodIcons.Harmonious,
    auraColor: AuraColor.Blue,
  },
  Flowing: {
    icon: MoodIcons.Flowing,
    auraColor: AuraColor.Orange
  },
  Weary: {
    icon: MoodIcons.Weary,
    auraColor: AuraColor.Gray
  },
  Tense: {
    icon: MoodIcons.Tense,
    auraColor: AuraColor.Red
  },
  Blocked: {
    icon: MoodIcons.Blocked,
    auraColor: AuraColor.Red
  },
  Restless: {
    icon: MoodIcons.Restless,
    auraColor: AuraColor.Indigo
  },
  Disconnected: {
    icon: MoodIcons.Disconnected,
    auraColor: AuraColor.Indigo
  },
  Heavy: {
    icon: MoodIcons.Heavy,
    auraColor: AuraColor.Blue
  },
  Charged: {
    icon: MoodIcons.Charged,
    auraColor: AuraColor.Red
  },
  Scattered: {
    icon: MoodIcons.Scattered,
    auraColor: AuraColor.Violet
  },
  Abundant: {
    icon: MoodIcons.Abundant,
    auraColor: AuraColor.Green
  },
  Visionary: {
    icon: MoodIcons.Visionary,
    auraColor: AuraColor.Pink
  },
  Neutral: {
    icon: MoodIcons.Neutral,
    auraColor: AuraColor.Gray,
  },
};
