export const Chakra = {
  Root: "Root",
  Sacral: "Sacral",
  SolarPlexus: "Solar Plexus",
  Heart: "Heart",
  Throat: "Throat",
  ThirdEye: "Third Eye",
  Crown: "Crown",
} as const;

/**
 * Type of all valid Chakra values
 */
export type Chakra = typeof Chakra[keyof typeof Chakra];

/**
 * Metadata describing a chakra: its enum value and core meaning.
 */
export interface ChakraInfoItem {
  /** The chakra identifier */
  name: Chakra;
  /** Description of the chakra’s core meaning */
  meaning: string;
}

/**
 * Strongly-typed map from Chakra to its descriptive metadata.
 */
export const ChakraInfo: Record<Chakra, ChakraInfoItem> = {
  [Chakra.Root]: {
    name: Chakra.Root,
    meaning: "Root Chakra: stability, security, and connection to the earth.",
  },
  [Chakra.Sacral]: {
    name: Chakra.Sacral,
    meaning: "Sacral Chakra: creativity, passion, and pleasure.",
  },
  [Chakra.SolarPlexus]: {
    name: Chakra.SolarPlexus,
    meaning: "Solar Plexus Chakra: willpower, self-esteem, and transformation.",
  },
  [Chakra.Heart]: {
    name: Chakra.Heart,
    meaning: "Heart Chakra: love, forgiveness, and emotional balance.",
  },
  [Chakra.Throat]: {
    name: Chakra.Throat,
    meaning: "Throat Chakra: communication, authenticity, and self-expression.",
  },
  [Chakra.ThirdEye]: {
    name: Chakra.ThirdEye,
    meaning: "Third Eye Chakra: intuition, imagination, and inner knowing.",
  },
  [Chakra.Crown]: {
    name: Chakra.Crown,
    meaning: "Crown Chakra: awareness, enlightenment, and connection to the divine.",
  },
} as const;

/**
 * Helper types for ChakraInfo
 */
export type ChakraInfoMap    = typeof ChakraInfo;
export type ChakraMeaning   = ChakraInfoMap[Chakra]["meaning"];
