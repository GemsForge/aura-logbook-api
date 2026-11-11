/** CSS adapter names for design tokens whose values are supplied by the API. */
export const prismGarden = {
  color: {
    canvas: "var(--aura-color-canvas)", surface: "var(--aura-color-surface)",
    surfaceSoft: "var(--aura-color-surfaceSoft)", stone: "var(--aura-color-stone)",
    ink: "var(--aura-color-ink)", inkMuted: "var(--aura-color-inkMuted)",
    line: "var(--aura-color-line)", focus: "var(--aura-color-focus)",
    sage: "var(--aura-color-sage)", rose: "var(--aura-color-rose)",
    terracotta: "var(--aura-color-terracotta)", amber: "var(--aura-color-amber)",
    blueGray: "var(--aura-color-blueGray)", orchid: "var(--aura-color-orchid)",
    berry: "var(--aura-color-berry)", turquoise: "var(--aura-color-turquoise)",
  },
  font: { body: "var(--aura-font-body)", display: "var(--aura-font-display)" },
  radius: {
    control: "var(--aura-radius-control)", card: "var(--aura-radius-card)",
    shell: "var(--aura-radius-shell)",
  },
  shadow: { soft: "var(--aura-shadow-soft)", raised: "var(--aura-shadow-raised)" },
} as const;

/** CSS variable adapter shape shared by page and component styles. */
export type PrismGardenTokens = typeof prismGarden;
