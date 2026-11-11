import Box from "@mui/joy/Box";
import type { SxProps } from "@mui/joy/styles/types";

type PrismMarkProps = {
  /** Width in CSS pixels; height follows the mark's fixed facet ratio. */
  size?: number;
  /** Optional Joy UI overrides for placement without changing the mark. */
  sx?: SxProps;
};

/**
 * Decorative, CSS-rendered brand mark used by the application shell.
 *
 * The mark is intentionally abstract and carries no required spiritual
 * meaning, supporting the product's inclusive-pathway principle. It is hidden
 * from assistive technology because the adjacent wordmark supplies the name.
 */
export default function PrismMark({ size = 28, sx }: PrismMarkProps) {
  return (
    <Box
      aria-hidden="true"
      data-testid="prism-mark"
      sx={[
        {
          width: size,
          height: size * 1.28,
          flex: "0 0 auto",
          clipPath: "polygon(50% 0, 100% 42%, 72% 100%, 28% 100%, 0 42%)",
          background: `
            linear-gradient(145deg, color-mix(in srgb, var(--aura-color-surface) 55%, transparent) 0 22%, transparent 23%),
            conic-gradient(from 215deg at 50% 42%, var(--aura-color-orchid), var(--aura-color-terracotta), var(--aura-color-amber), var(--aura-color-turquoise), var(--aura-color-focus), var(--aura-color-orchid))
          `,
          boxShadow: "var(--aura-shadow-raised)",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}
