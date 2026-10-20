import Box from "@mui/joy/Box";
import type { SxProps } from "@mui/joy/styles/types";

type PrismMarkProps = {
  size?: number;
  sx?: SxProps;
};

/** Decorative abstract prism mark. It carries no spiritual meaning. */
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
            linear-gradient(145deg, rgba(255,255,255,.55) 0 22%, transparent 23%),
            conic-gradient(from 215deg at 50% 42%, #815f7e, #c87961, #d39a4a, #2d7180, #654a5d, #815f7e)
          `,
          boxShadow: "0 3px 10px rgba(53, 45, 44, 0.22)",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}
