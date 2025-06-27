// src/api/ZodiacApi.ts
import type { ZodiacInsightResponse } from "@/features/zodiac/models/ZodiacInsightResponse";
import api from "./api";

const API_BASE = "Zodiac";

export const ZodiacApi = {
  getInsight: async (): Promise<ZodiacInsightResponse> => {
    const res = await api.get(`${API_BASE}/insights`);
    console.log(res.data);
    return res.data;
  },
};
