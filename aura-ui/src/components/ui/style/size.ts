import type { SxProps, Theme } from "@mui/material/styles";

export type AuraSize = "sm" | "md" | "lg";

export const DEFAULT_AURA_SIZE: AuraSize = "md";

export function getSizeStyles(
  theme: Theme,
  size: AuraSize = DEFAULT_AURA_SIZE
): SxProps<Theme> {
  if (size === "sm") {
    return {
      "--Card-padding": "1.25rem",
      p: "var(--Card-padding)",
      "--ModalDialog-titleOffset": theme.spacing(0.25),
      "--ModalDialog-descriptionOffset": theme.spacing(0.25),
      "--ModalClose-inset": "0.375rem",
    } as SxProps<Theme>;
  }

  if (size === "lg") {
    return {
      "--Card-padding": "2rem",
      p: "var(--Card-padding)",
      "--ModalDialog-titleOffset": theme.spacing(0.5),
      "--ModalDialog-descriptionOffset": theme.spacing(1),
      "--ModalClose-inset": "0.625rem",
    } as SxProps<Theme>;
  }

  return {
    "--Card-padding": "1.5rem",
    p: "var(--Card-padding)",
    "--ModalDialog-titleOffset": theme.spacing(0.25),
    "--ModalDialog-descriptionOffset": theme.spacing(0.75),
    "--ModalClose-inset": "0.5rem",
  } as SxProps<Theme>;
}
