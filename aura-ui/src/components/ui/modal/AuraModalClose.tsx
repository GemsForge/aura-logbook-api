import { forwardRef } from "react";
import type { ReactNode } from "react";
import IconButton, { type IconButtonProps } from "@mui/material/IconButton";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import type { SxProps, Theme } from "@mui/material/styles";

export interface AuraModalCloseProps extends IconButtonProps {
  icon?: ReactNode;
}

const AuraModalClose = forwardRef<HTMLButtonElement, AuraModalCloseProps>(function AuraModalClose(
  { icon = <CloseRoundedIcon fontSize="small" />, sx, "aria-label": ariaLabel = "Close", size = "small", ...props },
  ref,
) {
  const mergedSx: SxProps<Theme> = [
    {
      position: "absolute",
      inset: "var(--ModalClose-inset)",
      left: "auto",
      bottom: "auto",
      color: "inherit",
    },
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ];

  return (
    <IconButton ref={ref} size={size} sx={mergedSx} aria-label={ariaLabel} {...props}>
      {icon}
    </IconButton>
  );
});

export default AuraModalClose;
