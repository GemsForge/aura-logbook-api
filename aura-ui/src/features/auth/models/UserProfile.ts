import type { TemperatureUnit, WeatherLocationMode } from "@/features/weather/weatherLocation";
import type { AuraColor } from "@/features/mood/models/aura";
import type { SpiritualPathway } from "./SpiritualPathway";
import type { InterfaceTheme } from "./InterfaceTheme";

export interface UserProfile {
  id: number;
  email: string;
  displayName: string;
  birthday: string;
  avatar?: string; // base64 or image URL
  zodiacSign: string;
  auraColor?: AuraColor;
  auraIntensity?: number;
  motto?: string;
  selectedPathway: SpiritualPathway;
  /** Saved app appearance, independent of recorded aura color. */
  interfaceTheme?: InterfaceTheme;
  /** #331 weather location preference; device coordinates are never part of the profile. */
  weatherLocationMode?: WeatherLocationMode;
  weatherCity?: string | null;
  weatherRegion?: string | null;
  weatherCountry?: string | null;
  temperatureUnit?: TemperatureUnit;
}
