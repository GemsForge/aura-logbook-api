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

  lat?: number;
  lon?: number;
  city?: string;
  state?: string;
  country?: string;
}
