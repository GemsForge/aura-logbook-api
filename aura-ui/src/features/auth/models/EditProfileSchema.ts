import * as yup from "yup";

export const editProfileSchema = yup.object().shape({
      email: yup
        .string()
        .email("Enter a valid email")
        .required("Email is required"),
  displayName: yup.string().required("Display name is required"),
   birthday: yup
     .string()
     .required("Birthday is required"),
     password: yup
         .string()
         .min(6, "Password must be at least 6 characters")
         .required("Password is required"),
       confirmPassword: yup
         .string()
         .oneOf([yup.ref("password")], "Passwords must match")
         .required("Confirm your password")
 });

 export type EditProfileFormData = yup.InferType<typeof editProfileSchema>;
 