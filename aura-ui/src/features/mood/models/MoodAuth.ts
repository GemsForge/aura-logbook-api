import type { MoodType } from "./MoodType";

/**
 * Represents a mood entry submitted by the user.
 */
export interface MoodEntryRequest {
    /** One or more moods selected by the user */
    moods: MoodType[];
  
    /** Date of the entry in 'YYYY-MM-DD' format */
    date: string;
  
    /** Optional comment about the mood entry */
    comment?: string;
  }

/**
 * Represents the frequency of a mood, either as a raw count or percentage (but not both).
 */
export type MoodFrequencyResponse =
  | {
      mood: MoodType;
      count: number;
      percent?: never;
    }
  | {
      mood: MoodType;
      count?: never;
      percent: number;
    };

    export type MoodPercentResponse ={
      mood: MoodType | "Other"
      percent: number
    }


export interface MoodDashboardSummary {
  /** Total number of mood entries recorded */
  totalEntries: number;

  /** The most frequently logged mood, or null if not available */
  mostFrequentMood: MoodType | null;

  /** Number of consecutive days with mood entries */
  currentStreak: number;

  /** Date of the last mood entry (as a string: yyyy-mm-dd) */
  lastEntryDate: string | null;
}
