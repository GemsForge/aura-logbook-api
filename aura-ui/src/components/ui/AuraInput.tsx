import FormControl from "@mui/joy/FormControl";
import FormHelperText from "@mui/joy/FormHelperText";
import FormLabel from "@mui/joy/FormLabel";
import Input, { type InputProps as JoyInputProps } from "@mui/joy/Input";
import { forwardRef, type ReactNode } from "react";

export interface AuraInputProps extends Omit<JoyInputProps, "error"> {
  label?: ReactNode;
  helperText?: ReactNode;
  error?: boolean;
  margin?: "dense" | "normal" | "none";
}

export const AuraInput = forwardRef<HTMLInputElement, AuraInputProps>(
  function AuraInput(
    {
      label,
      helperText,
      error = false,
      margin = "none",
      sx,
      slotProps,
      ...inputProps
    },
    ref,
  ) {
    const marginY = margin === "normal" ? 1 : margin === "dense" ? 0.5 : 0;

    return (
      <FormControl
        error={error}
        sx={{ my: marginY, width: inputProps.fullWidth ? "100%" : undefined }}>
        {label != null && <FormLabel>{label}</FormLabel>}
        <Input
          {...inputProps}
          error={error}
          sx={sx}
          slotProps={{
            ...slotProps,
            input: { ...slotProps?.input, ref },
          }}
        />
        {helperText != null && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>
    );
  },
);
