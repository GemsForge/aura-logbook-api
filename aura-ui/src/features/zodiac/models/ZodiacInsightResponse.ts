// src/features/zodiac/models/ZodiacInsightResponse.ts

import type { MoodType } from "@/features/mood/models/schema";


/**
 * Mirror of your backend’s InsightTemplate.
 * Update these fields to match the actual C# model.
 */
export interface InsightTemplate {
  // e.g. templateId: string;
  // e.g. title: string;
  // e.g. message: string;
  [key: string]: any;
}

/**
 * DTO for the /api/Zodiac/insights response
 */
export interface ZodiacInsightResponse {
  /** e.g. "aries", "taurus", etc. */
  sign: string;
  /** Sign description */
  description: string;
  /** e.g. "fire", "earth" */
  element: string;

  /** Total number of mood entries for this sign */
  totalEntries: number;
  /** The most frequent mood (nullable) */
  mostFrequentMood: MoodType | null;
  /** Current streak of daily entries */
  currentStreak: number;
  /** ISO date (YYYY-MM-DD) of last entry, or null */
  lastEntryDate: string | null;

  /** Array of sign-specific insights from the backend */
  insights: InsightTemplate[];
}
