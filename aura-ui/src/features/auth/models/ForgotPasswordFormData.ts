import * as yup from "yup";

export interface ForgotPasswordFormData {
  email: string;
  newPassword: string;
  confirmPassword: string;
}

export const forgotPasswordSchema = yup
  .object({
    email: yup
      .string()
      .email("Enter a valid email")
      .required("Email is required"),

    newPassword: yup
      .string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),

    confirmPassword: yup
      .string()
      .required("Confirm your password")
      .oneOf([yup.ref("newPassword")], "Passwords must match"),
  })
  .required();
