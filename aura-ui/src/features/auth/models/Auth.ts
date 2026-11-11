import type { TemperatureUnit, WeatherLocationMode } from "@/features/weather/weatherLocation";
import type { AuraColor } from "@/features/mood/models/aura";
import type { SpiritualPathway } from "./SpiritualPathway";
import type { InterfaceTheme } from "./InterfaceTheme";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  birthday: string; // ISO string format (e.g., "2025-06-21") for DateOnly
  selectedPathway: SpiritualPathway;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  auraColor?: AuraColor;
  auraIntensity?: number;
}

export interface UpdateUserRequest {
  id: number;
  email: string;
  password?: string;
  displayName?: string;
  auraColor?: AuraColor;
  auraIntensity?: number;
  birthday: string;
  avatar?: string; // base64 or image URL
  selectedPathway: SpiritualPathway;
  /** Optional for compatibility with clients that predate interface themes. */
  interfaceTheme?: InterfaceTheme;
  /** #331 weather location preference; device coordinates are never part of the profile. */
  weatherLocationMode?: WeatherLocationMode;
  weatherCity?: string | null;
  weatherRegion?: string | null;
  weatherCountry?: string | null;
  temperatureUnit?: TemperatureUnit;
}
