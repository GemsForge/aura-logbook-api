/** Aura color choices are user-selected reflection metadata, not assessments. */
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

export interface AuraColorDefinition {
  key: AuraColor;
  displayName: string;
  baseHex: string;
  /** Legacy API metadata; keep this out of shared and default-screen content. */
  chakraKey?: string | null;
  description: string;
  isNeutral: boolean;
  isActive: boolean;
}

export interface AuraColorInfoItem {
  color: AuraColor;
  name: string;
  meaning: string;
}

export const AuraColorInfo: Record<AuraColor, AuraColorInfoItem> = {
  [AuraColor.Red]: {
    color: AuraColor.Red,
    name: "Red",
    meaning: "A reflective note of steadiness and grounding.",
  },
  [AuraColor.Orange]: {
    color: AuraColor.Orange,
    name: "Orange",
    meaning: "A reflective note of creativity and warmth.",
  },
  [AuraColor.Yellow]: {
    color: AuraColor.Yellow,
    name: "Yellow",
    meaning: "A reflective note of confidence and optimism.",
  },
  [AuraColor.Green]: {
    color: AuraColor.Green,
    name: "Green",
    meaning: "A reflective note of growth and harmony.",
  },
  [AuraColor.Blue]: {
    color: AuraColor.Blue,
    name: "Blue",
    meaning: "A reflective note of expression and clarity.",
  },
  [AuraColor.Indigo]: {
    color: AuraColor.Indigo,
    name: "Indigo",
    meaning: "A reflective note of insight and intuition.",
  },
  [AuraColor.Violet]: {
    color: AuraColor.Violet,
    name: "Violet",
    meaning: "A reflective note of imagination and possibility.",
  },
  [AuraColor.Gray]: {
    color: AuraColor.Gray,
    name: "Gray",
    meaning: "A reflective note for moments between states.",
  },
  [AuraColor.Pink]: {
    color: AuraColor.Pink,
    name: "Pink",
    meaning: "A reflective note of care and tenderness.",
  },
};
