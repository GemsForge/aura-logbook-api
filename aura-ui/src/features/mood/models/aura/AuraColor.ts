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
