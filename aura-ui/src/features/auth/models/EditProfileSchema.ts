import * as yup from "yup";

export const editProfileSchema: yup.ObjectSchema<EditProfileFormData> =
  yup.object({
    email: yup
      .string()
      .email("Enter a valid email")
      .required("Email is required"),
    displayName: yup.string().required("Display name is required"),
    birthday: yup.string().required("Birthday is required"),
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
  }) as yup.ObjectSchema<EditProfileFormData>;

//  export type EditProfileFormData = yup.InferType<typeof editProfileSchema>;
export interface EditProfileFormData {
  email: string;
  displayName: string;
  birthday: string;
  password?: string;
  confirmPassword?: string;
}

 