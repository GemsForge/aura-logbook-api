
import type {
    MoodEntryRequest,
    MoodFrequencyResponse,
    MoodDashboardSummary
} from "../features/mood/models/MoodAuth";
import type { MoodEntry } from "../features/mood/models/MoodEntry";
import api from "./api";

export const moodApi = {
  /**
   * Get all moods for the authenticated user (optionally filtered by date).
   */
  getAll: async (startDate?: string, endDate?: string): Promise<MoodEntry[]> => {
    const params = { startDate, endDate };
    const res = await api.get("/api/mood", { params });
    return res.data;
  },

  /**
   * Log a new mood entry.
   */
  logMood: async (payload: MoodEntryRequest): Promise<string> => {
    const res = await api.post("/api/mood", payload);
    return res.data;
  },

  /**
   * Get a specific mood entry by ID.
   */
  getById: async (id: number): Promise<MoodEntry> => {
    const res = await api.get(`/api/mood/${id}`);
    return res.data;
  },

  /**
   * Delete a mood entry by ID.
   */
  deleteById: async (id: number): Promise<string> => {
    const res = await api.delete(`/api/mood/${id}`);
    return res.data;
  },

  /**
   * Get summarized dashboard statistics.
   */
  getDashboardSummary: async (): Promise<MoodDashboardSummary> => {
    const res = await api.get("/api/mood/dashboard/summary");
    return res.data;
  },

  /**
   * Get moods grouped by date for a given range (e.g., 7 days).
   */
  getMoodsByDateRange: async (range: string = "7d"): Promise<Record<string, number>> => {
    const res = await api.get("/api/mood/dashboard/moods-by-date", {
      params: { range },
    });
    return res.data;
  },

  /**
   * Get mood breakdown by frequency or percentage.
   */
  getMoodBreakdown: async (percent = false): Promise<MoodFrequencyResponse[]> => {
    const res = await api.get("/api/mood/dashboard/mood-breakdown", {
      params: { percent },
    });
    return res.data;
  },

  /**
   * Seed dummy mood data (DEV ONLY).
   */
  seedTestData: async (days = 30): Promise<string> => {
    const res = await api.post("/api/mood/seed-test-data", null, {
      params: { days },
    });
    return res.data;
  },
};
