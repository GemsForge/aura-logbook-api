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
}
