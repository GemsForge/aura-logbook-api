// Account recovery forms (#329). Password rules mirror RegisterSchema and the API's PasswordRules.
import * as yup from "yup";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./RegisterSchema";

/**
 * Shows recovery links and routes. On in Vite dev; deployed builds opt in with
 * VITE_PASSWORD_RESET_ENABLED=true (case-insensitive, surrounding spaces ignored), kept in step with the API's PasswordReset:Enabled (#335).
 */
export const passwordResetEnabled =
  import.meta.env.DEV || import.meta.env.VITE_PASSWORD_RESET_ENABLED?.trim().toLowerCase() === "true";

export const forgotPasswordSchema = yup.object({
  email: yup.string().trim().email("Enter a valid email").required("Email is required"),
});
export type ForgotPasswordFormData = yup.InferType<typeof forgotPasswordSchema>;

export const resetPasswordSchema = yup.object({
  password: yup
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(PASSWORD_MAX_LENGTH, `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer`)
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Confirm your password"),
});
export type ResetPasswordFormData = yup.InferType<typeof resetPasswordSchema>;
