// Account recovery forms (#329). Password rules mirror RegisterSchema and the API's PasswordRules.
import * as yup from "yup";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./RegisterSchema";

/**
 * Recovery stays hidden in built deployments until the API has a reviewed production email sender.
 */
export const passwordResetEnabled = import.meta.env.DEV;

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
