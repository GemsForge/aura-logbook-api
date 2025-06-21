// src/features/auth/models/RegisterSchema.ts
import * as yup from "yup";

export const registerSchema = yup.object({
  email: yup
    .string()
    .email("Enter a valid email")
    .required("Email is required"),

  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),

  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Confirm your password"),
  displayName: yup
    .string()
    .max(30, "Display name must be 30 characters or fewer")
    .required("Display name is required"),

  birthday: yup
    .string()
    .required("Birthday is required"),
});

export type RegisterFormValues = yup.InferType<typeof registerSchema>;