import type { SxProps, Theme } from "@mui/material/styles";
import { DEFAULT_AURA_UI_COLOR, getColorStyles, type AuraUIColor } from "./color";
import { DEFAULT_AURA_LAYOUT, getLayoutStyles, type AuraLayout } from "./layout";
import { DEFAULT_AURA_SIZE, getSizeStyles, type AuraSize } from "./size";
import { DEFAULT_AURA_VARIANT, getVariantStyles, type AuraVariant } from "./variant";
import { DEFAULT_AURA_OVERFLOW, getOverflowStyles, type AuraOverflow } from "./overflow";

export interface AuraStyleOptions {
  variant?: AuraVariant;
  color?: AuraUIColor;
  layout?: AuraLayout;
  size?: AuraSize;
  overflow?: AuraOverflow;
  sx?: SxProps<Theme>;
}

export function getAuraStyles(theme: Theme, options: AuraStyleOptions = {}): SxProps<Theme> {
  const {
    variant = DEFAULT_AURA_VARIANT,
    color = DEFAULT_AURA_UI_COLOR,
    layout = DEFAULT_AURA_LAYOUT,
    size = DEFAULT_AURA_SIZE,
    overflow = DEFAULT_AURA_OVERFLOW,
    sx,
  } = options;

  const base: SxProps<Theme> = {
    position: "fixed",
    width: "100%",
    overflow: "visible",
    mx: "auto",
    bgcolor: "background.paper",
    boxShadow: 24,
    borderRadius: 3,
    boxSizing: "border-box",
    padding: "var(--Card-padding)",
    "--Modal-header-offset": "var(1.85rem)",
    "--Card-padding": "1.25rem",
    "--ModalDialog-titleOffset": "5px",
    "--ModalDialog-descriptionOffset": "0px",
    "--ModalClose-inset": "0.75rem",
  } as SxProps<Theme>;

  const styleStack: SxProps<Theme>[] = [
    base,
    getVariantStyles(theme, variant),
    getLayoutStyles(theme, layout),
    getColorStyles(theme, color),
    getSizeStyles(theme, size),
    getOverflowStyles(theme, overflow),
  ];

  if (sx) {
    if (Array.isArray(sx)) {
      styleStack.push(...sx);
    } else {
      styleStack.push(sx);
    }
  }

  return styleStack as SxProps<Theme>;
}
