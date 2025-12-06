import React from "react";
import { Box, useTheme } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { getAuraStyles } from "../style/auraStyles";
import type { AuraLayout } from "../style/layout";
import type { AuraSize } from "../style/size";
import type { AuraUIColor } from "../style/color";
import type { AuraVariant } from "../style/variant";
import type { AuraOverflow } from "../style/overflow";
import AuraDialogTitle from "./AuraDialogTitle";

export interface AuraModalDialogProps {
  id?: string;
  children?: React.ReactNode;
  variant?: AuraVariant;
  layout?: AuraLayout;
  color?: AuraUIColor;
  size?: AuraSize;
  overflow?: AuraOverflow;
  title?: React.ReactNode;
  sx?: SxProps<Theme>;
}

/**
 * AuraModalDialog mirrors Joy UI's ModalDialog surface.
 * Styling is composed from Aura design primitives and exposes CSS variables
 * for child components to inherit.
 */
export default function AuraModalDialog({
  id,
  children,
  variant,
  layout,
  color,
  size,
  overflow = "visible",
  title,
  sx,
}: AuraModalDialogProps) {
  const theme = useTheme();
  const mergedSx = getAuraStyles(theme, { variant, layout, color, size, overflow, sx });
  const isSticky = overflow === "scrollable" || overflow === "auto" || overflow === "scroll";
  const headerBg = theme.palette.background.paper;

  return (
    <Box id={id} sx={mergedSx}>
      {title ? (
        <AuraDialogTitle
          sx={{
            position: isSticky ? "sticky" : "relative",
            top: isSticky ? 0 : undefined,
            zIndex: 1,
            backgroundColor: headerBg,
          }}>
          {title}
        </AuraDialogTitle>
      ) : null}
      {children}
    </Box>
  );
}
