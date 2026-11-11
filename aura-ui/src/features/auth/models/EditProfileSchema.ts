import { weatherLocationModes, type TemperatureUnit, type WeatherLocationMode } from "@/features/weather/weatherLocation";
import { AuraColor } from "@/features/mood/models/aura";
import * as yup from "yup";
import { SpiritualPathway } from "./SpiritualPathway";
import { interfaceThemes, type InterfaceTheme } from "./InterfaceTheme";

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
  spiritualPathway: SpiritualPathway;
  interfaceTheme: InterfaceTheme;
  weatherLocationMode: WeatherLocationMode;
  weatherCity?: string;
  weatherRegion?: string;
  weatherCountry?: string;
  temperatureUnit: TemperatureUnit;
  isChangingPassword: boolean;
}

export const editProfileSchema = yup
  .object({
    email: yup
      .string()
      .email("Enter a valid email")
      .required("Email is required"),

    displayName: yup.string().required("Display name is required"),

    // Optional since #341: registration no longer asks for a birthday.
    birthday: yup.string().optional(),

    spiritualPathway: yup
      .mixed<SpiritualPathway>()
      .oneOf(
        Object.values(SpiritualPathway),
        "Select a valid spiritual pathway"
      )
      .required("Spiritual pathway is required"),

    interfaceTheme: yup
      .mixed<InterfaceTheme>()
      .oneOf([...interfaceThemes], "Select a valid interface theme")
      .required("Select an interface theme"),

    weatherLocationMode: yup.mixed<WeatherLocationMode>().oneOf([...weatherLocationModes]).required(),
    // A city is required only when weather follows a typed place (#331).
    weatherCity: yup.string().trim().max(100, "City can’t exceed 100 characters").when("weatherLocationMode", {
      is: "City",
      then: (schema) => schema.required("Enter a city for your weather"),
      otherwise: (schema) => schema.notRequired(),
    }),
    weatherRegion: yup.string().trim().max(100, "State or region can’t exceed 100 characters").notRequired(),
    weatherCountry: yup.string().trim().notRequired()
      .test("country-code", "Use a two-letter country code, like US", (value) => !value || /^[A-Za-z]{2}$/.test(value)),
    temperatureUnit: yup.mixed<TemperatureUnit>().oneOf(["F", "C"]).required(),

    avatar: yup.string().notRequired(),

    isChangingPassword: yup.boolean().notRequired(),

    password: yup
      .string()
      .transform((value, originalValue) =>
        originalValue === "" ? undefined : value
      )
      .when("isChangingPassword", {
        is: true,
        then: (schema) =>
          // Mirrors the API's PasswordRules (8–72) for authenticated password changes.
          schema
            .min(8, "Password must be at least 8 characters")
            .max(72, "Password must be 72 characters or fewer")
            .required("Password is required"),
        otherwise: (schema) => schema.notRequired(),
      }),

    confirmPassword: yup.string().when("isChangingPassword", {
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
      .min(0, "Intensity cannot be negative")
      .max(100, "Intensity cannot exceed 100")
      .nonNullable()
      .default(50)
      .notRequired(),

    motto: yup
      .string()
      .trim()
      .max(100, "Motto can’t exceed 100 characters")
      .nullable()
      .notRequired(),
  })
  .required();
