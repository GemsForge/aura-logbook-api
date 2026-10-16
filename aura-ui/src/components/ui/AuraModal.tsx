import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  type DialogProps,
} from "@mui/material";
import type { ReactNode } from "react";

export type AuraModalVariant = "standard" | "outlined" | "soft";
export type AuraModalColor = "primary" | "neutral" | "success" | "warning" | "danger";
export type AuraModalSize = "sm" | "md" | "lg" | "xl";

export interface AuraModalProps {
  open: boolean;
  onClose: NonNullable<DialogProps["onClose"]>;
  title: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  variant?: AuraModalVariant;
  color?: AuraModalColor;
  size?: AuraModalSize;
  layout?: "center" | "top";
  overflow?: "content" | "paper";
  fullWidth?: boolean;
  ariaLabelledBy?: string;
  contentSx?: DialogProps["sx"];
  actionsSx?: DialogProps["sx"];
  disableEscapeKeyDown?: boolean;
}

const maxWidths: Record<AuraModalSize, "xs" | "sm" | "md" | "lg" | "xl"> = {
  sm: "xs",
  md: "sm",
  lg: "md",
  xl: "lg",
};

const colorTokens: Record<AuraModalColor, string> = {
  primary: "primary.main",
  neutral: "text.primary",
  success: "success.main",
  warning: "warning.main",
  danger: "error.main",
};

export function AuraModal({
  open,
  onClose,
  title,
  children,
  actions,
  variant = "standard",
  color = "neutral",
  size = "md",
  layout = "center",
  overflow = "content",
  fullWidth = true,
  ariaLabelledBy,
  contentSx,
  actionsSx,
  disableEscapeKeyDown = false,
}: AuraModalProps) {
  const titleId = ariaLabelledBy ?? "aura-modal-title";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={titleId}
      maxWidth={maxWidths[size]}
      fullWidth={fullWidth}
      scroll="paper"
      disableEscapeKeyDown={disableEscapeKeyDown}
      sx={{
        "& .MuiDialog-container": {
          alignItems: layout === "top" ? "flex-start" : "center",
          pt: layout === "top" ? { xs: 2, sm: 6 } : 0,
        },
        "& .MuiDialog-paper": {
          overflow: overflow === "paper" ? "auto" : "hidden",
          border: variant === "outlined" ? 1 : 0,
          borderColor: variant === "outlined" ? colorTokens[color] : undefined,
          bgcolor:
            variant === "soft" && color !== "neutral"
              ? `${color === "danger" ? "error" : color}.light`
              : undefined,
        },
      }}>
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogContent sx={contentSx}>{children}</DialogContent>
      {actions != null && <DialogActions sx={actionsSx}>{actions}</DialogActions>}
    </Dialog>
  );
}
