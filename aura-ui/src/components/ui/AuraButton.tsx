import Button, { type ButtonProps as JoyButtonProps } from "@mui/joy/Button";
import type { ReactNode } from "react";

export type AuraButtonVariant = "contained" | "outlined" | "text" | "solid" | "soft" | "plain";
export type AuraButtonColor = "primary" | "neutral" | "success" | "warning" | "error" | "danger" | "inherit";
export type AuraButtonSize = "small" | "medium" | "large" | "sm" | "md" | "lg";

export type AuraButtonProps = Omit<JoyButtonProps, "variant" | "color" | "size" | "startDecorator" | "endDecorator"> & {
  variant?: AuraButtonVariant;
  color?: AuraButtonColor;
  size?: AuraButtonSize;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
};

const variants: Record<AuraButtonVariant, NonNullable<JoyButtonProps["variant"]>> = {
  contained: "solid",
  solid: "solid",
  outlined: "outlined",
  text: "plain",
  plain: "plain",
  soft: "soft",
};

const colors: Record<AuraButtonColor, NonNullable<JoyButtonProps["color"]>> = {
  primary: "primary",
  neutral: "neutral",
  success: "success",
  warning: "warning",
  error: "danger",
  danger: "danger",
  inherit: "neutral",
};

const sizes: Record<AuraButtonSize, NonNullable<JoyButtonProps["size"]>> = {
  small: "sm",
  medium: "md",
  large: "lg",
  sm: "sm",
  md: "md",
  lg: "lg",
};

export function AuraButton({
  variant = "text",
  color = "primary",
  size = "medium",
  startIcon,
  endIcon,
  ...props
}: AuraButtonProps) {
  return (
    <Button
      {...props}
      variant={variants[variant]}
      color={colors[color]}
      size={sizes[size]}
      startDecorator={startIcon}
      endDecorator={endIcon}
    />
  );
}
