/** Selectable theme families; legacy Ivory is represented by Aurora light. */
export const interfaceThemes = ["Aurora", "Earth", "Ocean", "Sunset", "Amethyst", "Midnight"] as const;
/** A theme family is independent from recorded aura color and screen brightness. */
export type InterfaceTheme = (typeof interfaceThemes)[number];
export const interfaceModes = ["light", "dark"] as const;
/** Account-persisted screen brightness within the selected theme family. */
export type InterfaceMode = (typeof interfaceModes)[number];
/** Normalize legacy Ivory and unknown families to Aurora. */
export function resolveInterfaceTheme(value: unknown): InterfaceTheme {
  return interfaceThemes.includes(value as InterfaceTheme) ? value as InterfaceTheme : "Aurora";
}
/** Shared default for new accounts, visitors and missing mode values. */
export const DEFAULT_INTERFACE_MODE: InterfaceMode = "light";
/** Explicit choices are honored; missing or unsupported values use light in every family. */
export function resolveInterfaceMode(value: unknown, _legacyTheme?: unknown): InterfaceMode {
  if (value === "light" || value === "dark") return value;
  return DEFAULT_INTERFACE_MODE;
}
