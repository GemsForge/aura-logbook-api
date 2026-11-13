import type { TemperatureUnit, WeatherLocationMode } from "@/features/weather/weatherLocation";
import type { AuraColor } from "@/features/mood/models/aura";
import type { SpiritualPathway } from "./SpiritualPathway";
import type { InterfaceTheme, InterfaceModePreference } from "./InterfaceTheme";

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
  /** Optional since #341; onboarding collects it. ISO date (YYYY-MM-DD) for DateOnly. */
  birthday?: string;
  /** Optional since #341; sending it marks the account as already onboarded. */
  selectedPathway?: SpiritualPathway;
}

/** Choices from the pathway page after the reveal; keys mirror the API allow-lists. */
export interface PathwayPreferences {
  focus: string[];
  /** Shared optional check-in opener: "none" | "three-breaths" | "one-minute". */
  checkInOpener?: string | null;
  /** Shared breathing timer visibility; defaults on for existing profiles. */
  breathingEnabled?: boolean;
  /** Broad optional faith lens; never inferred from other profile data. */
  faithTradition?: "christian" | "muslim" | "jewish" | "other" | "custom" | "neutral" | null;
  /** Birth time and place are retained only when the user explicitly opts in to saving them. */
  saveBirthDetails?: boolean;
  birthTime?: string | null;
  birthPlace?: string | null;
}

/** Body of `PUT /Auth/me/onboarding` (#341). */
export interface OnboardingRequest {
  selectedPathway: SpiritualPathway;
  birthday?: string;
  answers: { questionNumber: number; pathway: SpiritualPathway }[];
  colorMomentHue?: number;
  pathwayPreferences?: PathwayPreferences;
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
  /** Omit to keep the saved birthday. */
  birthday?: string;
  avatar?: string; // base64 or image URL
  /** Omit for focused account updates so the saved pathway remains unchanged. */
  selectedPathway?: SpiritualPathway;
  /** Optional aura reveals toggle (#344); omit to keep the saved value. */
  auraRevealsEnabled?: boolean;
  /** Optional for compatibility with clients that predate interface themes. */
  interfaceTheme?: InterfaceTheme;
  /** Saved brightness mode; independent of aura color and theme family. */
  interfaceMode?: InterfaceModePreference;
  /** #331 weather location preference; device coordinates are never part of the profile. */
  weatherLocationMode?: WeatherLocationMode;
  weatherCity?: string | null;
  weatherRegion?: string | null;
  weatherCountry?: string | null;
  temperatureUnit?: TemperatureUnit;
  pathwayPreferences?: PathwayPreferences;
}
