
import type {
    MoodEntryRequest,
    MoodFrequencyResponse,
    MoodDashboardSummary
} from "../features/mood/models/MoodAuth";
import type { MoodEntry } from "../features/mood/models/MoodEntry";
import api from "./api";

const API_BASE= 'Mood';
export const MoodApi = {
  /**
   * Get all moods for the authenticated user (optionally filtered by date).
   */
  getAllMoods: async (startDate?: string, endDate?: string): Promise<MoodEntry[]> => {
    const params = { startDate, endDate };
    const res = await api.get(API_BASE, { params });
    return res.data;
  },

  /**
   * Log a new mood entry.
   */
  logMood: async (payload: MoodEntryRequest): Promise<string> => {
    const res = await api.post(API_BASE, payload);
    return res.data;
  },

  /**
   * Get a specific mood entry by ID.
   */
  getById: async (id: number): Promise<MoodEntry> => {
    const res = await api.get(`${API_BASE}/${id}`);
    return res.data;
  },

  /**
   * Delete a mood entry by ID.
   */
  deleteMood: async (id: number): Promise<string> => {
    const res = await api.delete(`${API_BASE}/${id}`);
    return res.data;
  },

  /**
   * 
   * Update a mood entry
   */
  updateMood: async(id: number, payload: MoodEntryRequest):
  Promise<string> => {
    const res = await api.put(`${API_BASE}/${id}`,payload )
    return res.data;
  },

  /**
   * Get summarized dashboard statistics.
   */
  getDashboardSummary: async (): Promise<MoodDashboardSummary> => {
    const res = await api.get(`${API_BASE}/dashboard/summary`);
    return res.data;
  },

  /**
   * Get moods grouped by date for a given range (e.g., 7 days).
   */
  getMoodsByDateRange: async (range: string = "7d"): Promise<Record<string, number>> => {
    const res = await api.get(`${API_BASE}/dashboard/moods-by-date`, {
      params: { range },
    });
    return res.data;
  },

  /**
   * Get mood breakdown by frequency or percentage.
   */
  getMoodBreakdown: async (percent = false): Promise<MoodFrequencyResponse[]> => {
    const res = await api.get(`${API_BASE}/dashboard/mood-breakdown`, {
      params: { percent },
    });
    return res.data;
  },

  /**
   * Seed dummy mood data (DEV ONLY).
   */
  seedTestData: async (days = 30): Promise<string> => {
    const res = await api.post(`${API_BASE}/seed-test-data`, null, {
      params: { days },
    });
    return res.data;
  },
};
