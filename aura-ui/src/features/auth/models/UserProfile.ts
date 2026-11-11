import type { TemperatureUnit, WeatherLocationMode } from "@/features/weather/weatherLocation";
import type { AuraColor } from "@/features/mood/models/aura";
import type { SpiritualPathway } from "./SpiritualPathway";
import type { InterfaceTheme, InterfaceModePreference } from "./InterfaceTheme";
import type { PathwayPreferences } from "./Auth";

export interface UserProfile {
  id: number;
  email: string;
  displayName: string;
  /** Null when the user has not shared a birthday (#341). */
  birthday: string | null;
  avatar?: string; // base64 or image URL
  zodiacSign: string;
  auraColor?: AuraColor;
  auraIntensity?: number;
  motto?: string;
  selectedPathway: SpiritualPathway;
  /** Saved app appearance, independent of recorded aura color. */
  interfaceTheme?: InterfaceTheme;
  /** Saved brightness mode; independent of aura color and theme family. */
  interfaceMode?: InterfaceModePreference;
  /** #331 weather location preference; device coordinates are never part of the profile. */
  weatherLocationMode?: WeatherLocationMode;
  weatherCity?: string | null;
  weatherRegion?: string | null;
  weatherCountry?: string | null;
  temperatureUnit?: TemperatureUnit;
  /** False while onboarding is pending; the app routes to /onboarding until it is true. */
  onboardingCompleted?: boolean;
  /** Whether aura reveal copy and accents are shown. */
  auraRevealsEnabled?: boolean;
  pathwayPreferences?: PathwayPreferences | null;
}
