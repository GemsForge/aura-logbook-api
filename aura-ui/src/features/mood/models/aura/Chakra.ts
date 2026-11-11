/** Stable identifier for a database-backed chakra definition. */
export type Chakra = string;

/** API shape for a chakra definition. */
export interface ChakraDefinition {
  key: Chakra;
  displayName: string;
  description: string;
  sortOrder: number;
}
