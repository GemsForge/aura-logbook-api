/**
 * Framework-neutral design tokens for the Prism Garden visual system.
 *
 * These values define the stable application shell: warm neutral surfaces,
 * readable text, accessible focus treatment, restrained jewel accents, and
 * shared geometry. User-selected aura colors add translucent ambient glows over
 * the neutral canvas while text and popup surfaces retain their readable foundations.
 *
 * Keep this object independent of MUI so the same vocabulary can be mapped to
 * the future SwiftUI shell without importing web framework details.
 */
export const prismGarden = {
  color: {
    canvas: "#F5F4EF",
    surface: "#FFFEFA",
    surfaceSoft: "#EBEDE6",
    stone: "#DED3C3",
    ink: "#242B27",
    inkMuted: "#626B64",
    line: "#D8DDD4",
    focus: "#3E5948",
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
    control: "0.9rem",
    card: "1.5rem",
    shell: "2rem",
  },
  shadow: {
    soft: "0 1px 2px rgba(53, 45, 44, 0.06), 0 12px 36px rgba(95, 76, 61, 0.08)",
    raised: "0 18px 48px rgba(78, 62, 51, 0.14)",
  },
} as const;

/** Type-safe shape for adapters that consume the shared visual tokens. */
export type PrismGardenTokens = typeof prismGarden;
