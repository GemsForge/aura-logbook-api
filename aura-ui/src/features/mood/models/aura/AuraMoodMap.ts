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
  Joyful: {
    icon: MoodIcons.Joyful,
    auraColor: AuraColor.Yellow,
    chakra: Chakra.SolarPlexus,
  },
  Content: {
    icon: MoodIcons.Content,
    auraColor: AuraColor.Yellow,
    chakra: Chakra.SolarPlexus,
  },
  Peaceful: {
    icon: MoodIcons.Peaceful,
    auraColor: AuraColor.Blue,
    chakra: Chakra.Throat,
  },
  Motivated: {
    icon: MoodIcons.Motivated,
    auraColor: AuraColor.Orange,
    chakra: Chakra.Sacral,
  },
  Tired: {
    icon: MoodIcons.Tired,
    auraColor: AuraColor.Gray,
    chakra: Chakra.Root,
  },
  Stressed: {
    icon: MoodIcons.Stressed,
    auraColor: AuraColor.Red,
    chakra: Chakra.Root,
  },
  Frustrated: {
    icon: MoodIcons.Frustrated,
    auraColor: AuraColor.Red,
    chakra: Chakra.Root,
  },
  Anxious: {
    icon: MoodIcons.Anxious,
    auraColor: AuraColor.Indigo,
    chakra: Chakra.ThirdEye,
  },
  Lonely: {
    icon: MoodIcons.Lonely,
    auraColor: AuraColor.Indigo,
    chakra: Chakra.Heart,
  },
  Sad: {
    icon: MoodIcons.Sad,
    auraColor: AuraColor.Blue,
    chakra: Chakra.Heart,
  },
  Angry: {
    icon: MoodIcons.Angry,
    auraColor: AuraColor.Red,
    chakra: Chakra.Root,
  },
  Overwhelmed: {
    icon: MoodIcons.Overwhelmed,
    auraColor: AuraColor.Violet,
    chakra: Chakra.Crown,
  },
  Grateful: {
    icon: MoodIcons.Grateful,
    auraColor: AuraColor.Green,
    chakra: Chakra.Heart,
  },
  Hopeful: {
    icon: MoodIcons.Hopeful,
    auraColor: AuraColor.Pink,
    chakra: Chakra.Crown,
  },
  Meh: {
    icon: MoodIcons.Meh,
    auraColor: AuraColor.Gray,
    chakra: Chakra.SolarPlexus,
  },
};
