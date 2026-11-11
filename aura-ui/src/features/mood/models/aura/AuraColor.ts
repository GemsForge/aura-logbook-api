/** Stable identifier used for a database-backed aura color definition. */
export type AuraColor = string;

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
