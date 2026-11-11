/** Selectable theme families; legacy Ivory is represented by Aurora light. */
export const interfaceThemes = ["Aurora", "Earth", "Ocean", "Sunset", "Amethyst", "Midnight"] as const;
/** A theme family is independent from recorded aura color and screen brightness. */
export type InterfaceTheme = (typeof interfaceThemes)[number];
export const interfaceModes = ["light", "dark"] as const;
/** Account-persisted screen brightness within the selected theme family. */
export type InterfaceMode = (typeof interfaceModes)[number];
/** Persisted preference stays system even when the device changes effective brightness. */
export type InterfaceModePreference = InterfaceMode | "system";
export const interfaceModePreferences = [...interfaceModes, "system"] as const;
/** Normalize legacy Ivory and unknown families to Aurora. */
export function resolveInterfaceTheme(value: unknown): InterfaceTheme {
  return interfaceThemes.includes(value as InterfaceTheme) ? value as InterfaceTheme : "Aurora";
}
/** Shared default for new accounts, visitors and missing mode values. */
export const DEFAULT_INTERFACE_MODE: InterfaceMode = "light";
/** Explicit choices are honored; missing or unsupported values use light in every family. */
export function resolveInterfaceMode(value: unknown): InterfaceModePreference {
  if (value === "light" || value === "dark" || value === "system") return value;
  return DEFAULT_INTERFACE_MODE;
}

/** Resolve display colors without replacing the account's saved system preference. */
export function resolveEffectiveInterfaceMode(value: unknown, systemMode: InterfaceMode = "light"): InterfaceMode {
  const preference = resolveInterfaceMode(value);
  return preference === "system" ? systemMode : preference;
}
/** Read device appearance safely in browsers without media-query support. */
export function readSystemInterfaceMode(): InterfaceMode {
  try { return globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"; }
  catch { return "light"; }
}
/** Subscribe once and release the listener on unmount; no profile writes occur on device changes. */
export function watchSystemInterfaceMode(onChange: (mode: InterfaceMode) => void): () => void {
  if (typeof globalThis.matchMedia !== "function") { onChange("light"); return () => {}; }
  const query = globalThis.matchMedia("(prefers-color-scheme: dark)");
  const update = () => onChange(query.matches ? "dark" : "light");
  update();
  query.addEventListener("change", update);
  return () => query.removeEventListener("change", update);
}
