import type { MoodType } from "./MoodType";

/**
 * Represents a mood entry submitted by a user.
 */
export interface MoodEntry {
  id: number;
  userId: number;
  date: string; // ISO string format (e.g., "2025-06-21") for DateOnly
  moods: MoodType[];
  comment?: string;
  createdAt: string; // ISO timestamp (e.g., "2025-06-21T14:32:00Z")
  /** JSON weather snapshot captured at check-in ({ description, iconCode, temperature, unit }), when available. */
  weatherSnapshot?: string | null;
  /** JSON snapshot of the Spotify track playing at check-in ({ name, artists }), when available. */
  musicTrack?: string | null;
  /** Number of private photos attached to the entry. */
  photoCount?: number;
}
