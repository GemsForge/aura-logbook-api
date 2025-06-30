// src/api/ZodiacApi.ts
import type { ZodiacInsightResponse } from "@/features/zodiac/models/ZodiacInsightResponse";
import api from "./api";

// Matches BE: GET /api/insights/zodiac
const API_BASE = "insights";

export const ZodiacApi = {
  getInsight: async (): Promise<ZodiacInsightResponse> => {
    const res = await api.get(`${API_BASE}/zodiac`);
    return res.data;
  },
};
