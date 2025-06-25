import { Chakra, ChakraInfo } from "./Chakra";

export const AuraColor = {
  Red: "red",
  Orange: "orange",
  Yellow: "yellow",
  Green: "green",
  Blue: "blue",
  Indigo: "indigo",
  Violet: "violet",
  Gray: "gray",
  Pink: "pink",
} as const;


export type AuraColor = (typeof AuraColor)[keyof typeof AuraColor];

export interface AuraColorInfoItem {
  color: AuraColor;
  name: string;
  meaning: string;
  chakra: Chakra;
  chakraMeaning: string;
}

export const AuraColorInfo: Record<AuraColor, AuraColorInfoItem> = {
  [AuraColor.Red]: {
    color: AuraColor.Red,
    name: "Red",
    meaning: "Rooted, grounded energy for safety and survival.",
    chakra: Chakra.Root,
    chakraMeaning: ChakraInfo[Chakra.Root].meaning,
  },
  [AuraColor.Orange]: {
    color: AuraColor.Orange,
    name: "Orange",
    meaning: "Creative flow and emotional warmth.",
    chakra: Chakra.Sacral,
    chakraMeaning: ChakraInfo[Chakra.Sacral].meaning,
  },
  [AuraColor.Yellow]: {
    color: AuraColor.Yellow,
    name: "Yellow",
    meaning: "Personal power, confidence, and optimism.",
    chakra: Chakra.SolarPlexus,
    chakraMeaning: ChakraInfo[Chakra.SolarPlexus].meaning,
  },
  [AuraColor.Green]: {
    color: AuraColor.Green,
    name: "Green",
    meaning: "Compassion, growth, and harmony.",
    chakra: Chakra.Heart,
    chakraMeaning: ChakraInfo[Chakra.Heart].meaning,
  },
  [AuraColor.Blue]: {
    color: AuraColor.Blue,
    name: "Blue",
    meaning: "Expression, truth, and clear communication.",
    chakra: Chakra.Throat,
    chakraMeaning: ChakraInfo[Chakra.Throat].meaning,
  },
  [AuraColor.Indigo]: {
    color: AuraColor.Indigo,
    name: "Indigo",
    meaning: "Intuition, insight, and inner wisdom.",
    chakra: Chakra.ThirdEye,
    chakraMeaning: ChakraInfo[Chakra.ThirdEye].meaning,
  },
  [AuraColor.Violet]: {
    color: AuraColor.Violet,
    name: "Violet",
    meaning: "Spirituality, higher purpose, and connection to the divine.",
    chakra: Chakra.Crown,
    chakraMeaning: ChakraInfo[Chakra.Crown].meaning,
  },
  [AuraColor.Gray]: {
    color: AuraColor.Gray,
    name: "Gray",
    meaning: "Neutrality; grounding when in‐between states.",
    chakra: Chakra.Root,
    chakraMeaning: ChakraInfo[Chakra.Root].meaning,
  },
  [AuraColor.Pink]: {
    color: AuraColor.Pink,
    name: "Pink",
    meaning: "Unconditional love, warmth, and heart‐centered joy.",
    chakra: Chakra.Heart,
    chakraMeaning: ChakraInfo[Chakra.Heart].meaning,
  },
};
