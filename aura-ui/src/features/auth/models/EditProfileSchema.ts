import { AuraColor } from "@/features/mood/models/aura";
import * as yup from "yup";

const auraColors = Object.values(AuraColor) as AuraColor[];

export interface EditProfileFormData {
  email: string;
  displayName: string;
  birthday: string;
  avatar?: string;
  // avatarType: "image" | "initials";
  initials?: string;
  password?: string;
  confirmPassword?: string;
  auraColor: AuraColor;
  auraIntensity?: number | null;
  motto?: string;
}

export const editProfileSchema = yup
  .object({
    email: yup
      .string()
      .email("Enter a valid email")
      .required("Email is required"),

    displayName: yup.string().required("Display name is required"),

    birthday: yup.string().required("Birthday is required"),

    avatar: yup.string().required("Pick an avatar or enter initials"),

    // avatarType: yup
    //   .mixed<"image" | "initials">()
    //   .oneOf(["image", "initials"])
    //   .required("Choose avatar style"),

    // initials: yup.string().when("avatarType", {
    //   is: "initials",
    //   then: (s) =>
    //     s
    //       .required("Enter your initials")
    //       .matches(/^[A-Za-z]{1,2}$/, "1–2 letters only"),
    //   otherwise: (s) => s.strip(), // remove from payload if not initials
    // }),

    password: yup.string().when("$isChangingPassword", {
      is: true,
      then: (schema) =>
        schema
          .min(6, "Password must be at least 6 characters")
          .required("Password is required"),
      otherwise: (schema) => schema.notRequired(),
    }),

    confirmPassword: yup.string().when("$isChangingPassword", {
      is: true,
      then: (schema) =>
        schema
          .required("Confirm your password")
          .oneOf([yup.ref("password")], "Passwords must match"),
      otherwise: (schema) => schema.notRequired(),
    }),

    auraColor: yup
      .mixed<AuraColor>()
      .oneOf(auraColors, "Select a valid aura color")
      .required("Aura color is required"),

    auraIntensity: yup
      .number()
      .min(100, "Intensity must be at least 100")
      .max(900, "Intensity cannot exceed 900")
      .nonNullable()
      .default(500)
      .notRequired(),

    motto: yup
      .string()
      .trim()
      .max(100, "Motto can’t exceed 100 characters")
      .nullable()
      .notRequired(),
  })
  .required();
