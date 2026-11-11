import { Button } from "@mui/joy";
import { forwardRef, useState } from "react";
import { AuraInput, type AuraInputProps } from "./AuraInput";

export type PasswordFieldProps = Omit<AuraInputProps, "type">;

/** Password input with an accessible visibility control and a stable form ref. */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField(props, ref) {
    const [visible, setVisible] = useState(false);
    const label = visible ? "Hide password" : "Show password";

    return (
      <AuraInput
        {...props}
        ref={ref}
        type={visible ? "text" : "password"}
        endDecorator={
          <Button
            type="button"
            variant="plain"
            size="sm"
            aria-label={label}
            aria-pressed={visible}
            onClick={() => setVisible((current) => !current)}
          >
            {visible ? "Hide" : "Show"}
          </Button>
        }
      />
    );
  },
);
