import type { AuraColor } from "@/features/mood/models/aura";
import type { SpiritualPathway } from "./SpiritualPathway";

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
  spiritualPathways?: SpiritualPathway[]; // Array of SpiritualPathway values

  lat?: number;
  lon?: number;
  city?: string;
  state?: string;
  country?: string;
}
