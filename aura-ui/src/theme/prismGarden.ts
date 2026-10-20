/**
 * Framework-neutral design tokens for the Prism Garden visual system.
 *
 * These values define the stable application shell: warm neutral surfaces,
 * readable text, accessible focus treatment, restrained jewel accents, and
 * shared geometry. User-selected aura colors remain contextual data and must
 * not replace these shell colors across large surfaces.
 *
 * Keep this object independent of MUI so the same vocabulary can be mapped to
 * the future SwiftUI shell without importing web framework details.
 */
export const prismGarden = {
  color: {
    canvas: "#F7F2EA",
    surface: "#FFFCF7",
    surfaceSoft: "#EDE5D9",
    stone: "#DED3C3",
    ink: "#352D2C",
    inkMuted: "#665D56",
    line: "#D9CEC0",
    focus: "#654A5D",
    sage: "#87917B",
    rose: "#C79A98",
    terracotta: "#C87961",
    amber: "#D39A4A",
    blueGray: "#91A3AC",
    orchid: "#815F7E",
    berry: "#7F263F",
    turquoise: "#2D7180",
  },
  font: {
    body: 'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    display:
      '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif',
  },
  radius: {
    control: "0.625rem",
    card: "1rem",
    shell: "1.5rem",
  },
  shadow: {
    soft: "0 1px 2px rgba(53, 45, 44, 0.06), 0 12px 36px rgba(95, 76, 61, 0.08)",
    raised: "0 18px 48px rgba(78, 62, 51, 0.14)",
  },
} as const;

/** Type-safe shape for adapters that consume the shared visual tokens. */
export type PrismGardenTokens = typeof prismGarden;
