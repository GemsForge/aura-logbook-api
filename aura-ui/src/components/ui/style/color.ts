import type { SxProps, Theme } from "@mui/material/styles";

export type AuraUIColor = "neutral" | "primary" | "danger" | "success" | "warning";

export const DEFAULT_AURA_UI_COLOR: AuraUIColor = "neutral";

export function getColorStyles(theme: Theme, color: AuraUIColor = DEFAULT_AURA_UI_COLOR): SxProps<Theme> {
  switch (color) {
    case "primary":
      return { borderColor: theme.palette.primary.main };
    case "danger":
      return { borderColor: theme.palette.error.main };
    case "success":
      return { borderColor: theme.palette.success.main };
    case "warning":
      return { borderColor: theme.palette.warning.main };
    case "neutral":
    default:
      return {};
  }
}
