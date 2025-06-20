export const Chakra = {
  Root: "Root",
  Sacral: "Sacral",
  SolarPlexus: "Solar Plexus",
  Heart: "Heart",
  Throat: "Throat",
  ThirdEye: "Third Eye",
  Crown: "Crown",
} as const;

export type Chakra = (typeof Chakra) [keyof typeof Chakra];
