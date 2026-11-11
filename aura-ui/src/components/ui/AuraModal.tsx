import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useMediaQuery,
  type DialogProps,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
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
  /**
   * When set, the dialog fills the viewport below this breakpoint so long forms
   * get the full phone width instead of the default dialog margins. Off by default.
   */
  fullScreenBelow?: "sm" | "md";
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
  fullScreenBelow,
}: AuraModalProps) {
  const theme = useTheme();
  // Hooks must run unconditionally; an impossible query keeps the default (not full screen).
  const isFullScreen = useMediaQuery(
    fullScreenBelow ? theme.breakpoints.down(fullScreenBelow) : "(max-width:0px)"
  );
  const titleId = ariaLabelledBy ?? "aura-modal-title";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={titleId}
      maxWidth={maxWidths[size]}
      fullWidth={fullWidth}
      fullScreen={isFullScreen}
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
