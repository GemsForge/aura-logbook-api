import type { SxProps, Theme } from "@mui/material/styles";

export type AuraLayout = "center" | "fullscreen";

export const DEFAULT_AURA_LAYOUT: AuraLayout = "center";

export function getLayoutStyles(_: Theme, layout: AuraLayout = DEFAULT_AURA_LAYOUT): SxProps<Theme> {
  if (layout === "fullscreen") {
    return {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      border: 0,
      borderRadius: 0,
    };
  }

  return {
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    maxWidth: "min(calc(100vw - 2 * var(--Card-padding)), var(--ModalDialog-maxWidth, 100vw))",
    maxHeight: "calc(100% - 2 * var(--Card-padding))",
  };
}
