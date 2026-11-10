// src/features/auth/models/RegisterSchema.ts
import * as yup from "yup";
import { SpiritualPathway } from "./SpiritualPathway";

export const registerSchema = yup.object({
  email: yup
    .string()
    .email("Enter a valid email")
    .required("Email is required"),
  // Mirrors the API's PasswordRules (8–72; 72 is bcrypt's input limit).
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be 72 characters or fewer")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Confirm your password"),
  displayName: yup
    .string()
    .max(30, "Display name must be 30 characters or fewer")
    .required("Display name is required"),
  birthday: yup.string().required("Birthday is required"),
  spiritualPathway: yup
    .mixed<SpiritualPathway>()
    .oneOf(Object.values(SpiritualPathway), "Select a pathway")
    .required("Select a pathway"),
});

export type RegisterFormValues = yup.InferType<typeof registerSchema>;
