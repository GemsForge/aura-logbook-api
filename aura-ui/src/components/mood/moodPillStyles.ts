/** Returns the shared aura-glass surface used by mood controls, check-ins, and history tags. */
export function getMoodPillSx(color: string, { selected = false, interactive = false }: { selected?: boolean; interactive?: boolean } = {}) {
  return {
    color: "var(--al-theme-ink)",
    border: `1px solid color-mix(in srgb, ${color} ${selected ? 72 : 38}%, transparent)`,
    backgroundColor: `color-mix(in srgb, ${color} ${selected ? 24 : 14}%, var(--al-theme-surface))`,
    backdropFilter: "blur(10px) saturate(1.15)",
    boxShadow: selected
      ? `0 0 0 2px color-mix(in srgb, ${color} 30%, transparent), 0 0 16px color-mix(in srgb, ${color} 28%, transparent)`
      : `0 2px 10px color-mix(in srgb, ${color} 18%, transparent)`,
    ...(interactive ? {
      transition: "background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
      "&:hover": {
        backgroundColor: `color-mix(in srgb, ${color} 24%, var(--al-theme-surface))`,
        borderColor: `color-mix(in srgb, ${color} 58%, transparent)`,
        boxShadow: `0 0 14px color-mix(in srgb, ${color} 30%, transparent)`,
        transform: "translateY(-1px)",
      },
      "&:focus-visible": { outline: `2px solid ${color}`, outlineOffset: 2 },
    } : {}),
  };
}
