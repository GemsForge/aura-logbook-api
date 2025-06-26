import type { AuraColor } from "@/features/mood/models/aura";

export interface UserProfile {
  id: number;
  email: string;
  displayName: string;
  token: string;
  birthday: string;
  avatar?: string; // base64 or image URL
  zodiacSign: string;
  auraColor?: AuraColor;
  auraIntensity?: number;
  motto?: string;

  lat?: number;
  lon?: number;
  city?: string;
  state?: string;
  country?: string;
}
