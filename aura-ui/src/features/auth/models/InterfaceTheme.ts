/** Supported visual themes for the Aura Logbook interface. */
export const interfaceThemes = [
  "Aurora",
  "Earth",
  "Ocean",
  "Sunset",
  "Amethyst",
  "Midnight",
  "Ivory",
] as const;

/** A saved interface appearance, independent of the user's recorded aura color. */
export type InterfaceTheme = (typeof interfaceThemes)[number];

/** Returns a supported theme or the stable Aurora default for legacy data. */
export function resolveInterfaceTheme(value: unknown): InterfaceTheme {
  return typeof value === "string" && interfaceThemes.includes(value as InterfaceTheme)
    ? (value as InterfaceTheme)
    : "Aurora";
}
