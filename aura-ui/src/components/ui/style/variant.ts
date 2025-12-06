import type { SxProps, Theme } from "@mui/material/styles";

export type AuraVariant = "plain" | "outlined" | "soft" | "solid";

export const DEFAULT_AURA_VARIANT: AuraVariant = "plain";

export function getVariantStyles(theme: Theme, variant: AuraVariant = DEFAULT_AURA_VARIANT): SxProps<Theme> {
  switch (variant) {
    case "outlined":
      return {
        border: "1px solid",
        borderColor: theme.palette.divider,
      };
    case "soft":
      return {
        backgroundColor: theme.palette.grey[100],
      };
    case "solid":
      return {
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      };
    case "plain":
    default:
      return {};
  }
}
