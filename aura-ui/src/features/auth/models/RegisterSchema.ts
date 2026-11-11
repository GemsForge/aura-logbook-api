// Registration constraints shared by the form and password guidance.
import * as yup from "yup";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

export const registerSchema = yup.object({
  email: yup
    .string()
    .trim()
    .lowercase()
    .email("Enter a valid email")
    .required("Email is required"),
  // Mirrors the API's PasswordRules (8–72; 72 is bcrypt's input limit).
  password: yup
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(PASSWORD_MAX_LENGTH, `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer`)
    .required("Password is required"),
  displayName: yup
    .string()
    .trim()
    .max(30, "Display name must be 30 characters or fewer")
    .required("Display name is required"),
  // #342: birthday and pathway moved to onboarding, so registration stays short.
});

export type RegisterFormValues = yup.InferType<typeof registerSchema>;
