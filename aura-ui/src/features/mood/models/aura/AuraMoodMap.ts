import { type MoodIcon, MoodIcons } from "./MoodIcons";
import { Chakra } from "./Chakra";
import { AuraColor } from "./AuraColor";
import type { MoodType } from "../schema/MoodType";

export interface AuraMoodMeta {
  icon: MoodIcon;
  auraColor: AuraColor;
  chakra: Chakra;
}

export const AuraMoodMap: Record<MoodType, AuraMoodMeta> = {
  Empowered: {
    icon: MoodIcons.Empowered,
    auraColor: AuraColor.Yellow,
    chakra: Chakra.SolarPlexus,
  },
  Centered: {
    icon: MoodIcons.Centered,
    auraColor: AuraColor.Yellow,
    chakra: Chakra.SolarPlexus,
  },
  Harmonious: {
    icon: MoodIcons.Harmonious,
    auraColor: AuraColor.Blue,
    chakra: Chakra.Throat,
  },
  Flowing: {
    icon: MoodIcons.Flowing,
    auraColor: AuraColor.Orange,
    chakra: Chakra.Sacral,
  },
  Weary: {
    icon: MoodIcons.Weary,
    auraColor: AuraColor.Gray,
    chakra: Chakra.Root,
  },
  Tense: {
    icon: MoodIcons.Tense,
    auraColor: AuraColor.Red,
    chakra: Chakra.Root,
  },
  Blocked: {
    icon: MoodIcons.Blocked,
    auraColor: AuraColor.Red,
    chakra: Chakra.Root,
  },
  Restless: {
    icon: MoodIcons.Restless,
    auraColor: AuraColor.Indigo,
    chakra: Chakra.ThirdEye,
  },
  Disconnected: {
    icon: MoodIcons.Disconnected,
    auraColor: AuraColor.Indigo,
    chakra: Chakra.Heart,
  },
  Heavy: {
    icon: MoodIcons.Heavy,
    auraColor: AuraColor.Blue,
    chakra: Chakra.Heart,
  },
  Charged: {
    icon: MoodIcons.Charged,
    auraColor: AuraColor.Red,
    chakra: Chakra.Root,
  },
  Scattered: {
    icon: MoodIcons.Scattered,
    auraColor: AuraColor.Violet,
    chakra: Chakra.Crown,
  },
  Abundant: {
    icon: MoodIcons.Abundant,
    auraColor: AuraColor.Green,
    chakra: Chakra.Heart,
  },
  Visionary: {
    icon: MoodIcons.Visionary,
    auraColor: AuraColor.Pink,
    chakra: Chakra.Crown,
  },
  Neutral: {
    icon: MoodIcons.Neutral,
    auraColor: AuraColor.Gray,
    chakra: Chakra.SolarPlexus,
  },
};
