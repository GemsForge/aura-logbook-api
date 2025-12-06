import { forwardRef } from "react";
import Box, { type BoxProps } from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";

export type AuraDialogContentProps = BoxProps;

const AuraDialogContent = forwardRef<HTMLDivElement, AuraDialogContentProps>(function AuraDialogContent(
  { sx, component = "div", ...props },
  ref,
) {
  const mergedSx: SxProps<Theme> = [
    {
      mt: "var(--ModalDialog-descriptionOffset)",
      color: "text.secondary",
    },
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ];

  return <Box ref={ref} component={component} sx={mergedSx} {...props} />;
});

export default AuraDialogContent;
