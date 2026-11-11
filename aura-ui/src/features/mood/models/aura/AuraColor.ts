/** Stable identifier used for a database-backed aura color definition. */
export type AuraColor = string;

/** Compatibility keys for defaults and older components; option lists come from reference data. */
export const AuraColor = {
  Red: "red", Orange: "orange", Yellow: "yellow", Green: "green", Blue: "blue",
  Indigo: "indigo", Violet: "violet", Gray: "gray", Pink: "pink",
} as const;

/** API shape for one aura color and its database-managed shades. */
export interface AuraColorDefinition {
  key: AuraColor;
  displayName: string;
  baseHex: string;
  chakraKey: string | null;
  description: string;
  isNeutral: boolean;
  sortOrder?: number;
  shades?: Record<number, string>;
}
