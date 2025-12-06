import { forwardRef } from "react";
import Typography, { type TypographyProps } from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

export type AuraDialogTitleProps = TypographyProps;

const AuraDialogTitle = forwardRef<HTMLSpanElement, AuraDialogTitleProps>(function AuraDialogTitle(
  { sx, component = "h2", variant = "h6", ...props },
  ref,
) {
  const mergedSx: SxProps<Theme> = [
    {
      mt: "var(--ModalDialog-titleOffset)",
      mb: 1,
      fontWeight: 600,
    },
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ];

  return <Typography ref={ref} component={component} variant={variant} sx={mergedSx} gutterBottom {...props} />;
});

export default AuraDialogTitle;
