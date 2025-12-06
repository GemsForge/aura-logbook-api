import React from "react";
import Modal from "@mui/material/Modal";
import type { SxProps, Theme } from "@mui/material/styles";
import AuraModalDialog from "./AuraModalDialog";
import AuraDialogTitle from "./AuraDialogTitle";
import type { AuraVariant } from "../style/variant";
import type { AuraLayout } from "../style/layout";
import type { AuraUIColor } from "../style/color";
import type { AuraSize } from "../style/size";
import type { AuraOverflow } from "../style/overflow";

// Base props from MUI Modal
export type ModalProps = React.ComponentProps<typeof Modal>;

export interface AuraModalProps extends Omit<ModalProps, "title"> {
  /** Visual variant of the dialog surface (Joy-style grammar). */
  variant?: AuraVariant;
  /** Layout of the dialog: centered card or fullscreen sheet. */
  layout?: AuraLayout;
  /** Semantic color mapped from the theme palette. */
  color?: AuraUIColor;
  /** Optional id applied to the dialog surface for easier DevTools inspection. */
  id?: string;
  /** Optional dialog title rendered above scrollable content. */
  title?: React.ReactNode;
  /** Optional extra sx overrides applied to the dialog surface. */
  dialogSx?: SxProps<Theme>;
  /** Size of the dialog surface. */
  size?: AuraSize;
  /** Overflow behavior for the dialog surface. */
  overflow?: AuraOverflow;
  
}

/**
 * AuraModal mirrors Joy UI's <Modal> + <ModalDialog> pattern.
 *
 * - The MUI <Modal> handles the portal, backdrop, focus lock, etc.
 * - <AuraModalDialog> renders the styled dialog surface and receives
 *   variant, color, layout, and id props.
 */
export default function AuraModal(props: AuraModalProps) {
  const {
    children,
    variant = "plain",
    layout = "center",
    color = "neutral",
    id,
    title,
    dialogSx,
    size = "md",
    overflow,
    sx,
    ...modalProps
  } = props;
  const dialogTitle = title ? <AuraDialogTitle>{title}</AuraDialogTitle> : undefined;

  return (
    <Modal
      {...modalProps}
      sx={{
        display: "flex",
        alignItems: layout === "center" ? "center" : "stretch",
        justifyContent: "center",
        ...sx,
      }}>
      <AuraModalDialog
        id={id}
        variant={variant}
        layout={layout}
        color={color}
        size={size}
        overflow={overflow}
        title={dialogTitle}
        sx={dialogSx}>
        {children}
      </AuraModalDialog>
    </Modal>
  );
}
