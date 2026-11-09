// src/store/auraApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ZodiacApi } from "@/api/ZodiacApi";
import type { ZodiacInsightResponse } from "@/features/zodiac/models/ZodiacInsightResponse";
import type { RootState } from "./store";
import type { MoodType } from "@/features/mood/models/schema/MoodType";

/** Pathway reflection returned for one exact selected mood combination. */
export type MoodCombinationInterpretation = {
  combinationId: string;
  moods: string[];
  pathwayKey: number;
  interpretation: string;
};

export const auraApi = createApi({
  reducerPath: "auraApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Zodiac", "MoodCombinationInterpretation"],
  endpoints: (build) => ({
    getZodiacInsight: build.query<ZodiacInsightResponse, void>({
      // instead of build.query({ query: ... }), we call our existing Axios wrapper:
      async queryFn() {
        try {
          const data = await ZodiacApi.getInsight(); // your existing client method :contentReference[oaicite:0]{index=0}
          return { data };
        } catch (err: unknown) {
          const error = err instanceof Error ? err : new Error("Zodiac request failed");
          const response = typeof err === "object" && err !== null && "response" in err
            ? (err as { response?: { status?: number; data?: unknown } }).response
            : undefined;
          return {
            error: {
              status: response?.status ?? 500,
              data: response?.data ?? error.message,
            },
          };
        }
      },
      providesTags: ["Zodiac"], // so you can later invalidate it
      keepUnusedDataFor: 600, // seconds in cache
    }),
    getMoodCombinationInterpretation: build.query<MoodCombinationInterpretation | null, { moods: MoodType[]; pathwayKey: number }>({
      query: ({ moods, pathwayKey }) => ({
        url: "/mood-combinations/interpretation",
        params: { moods: moods.join(","), pathwayKey },
      }),
      transformResponse: (response: MoodCombinationInterpretation | null) => response,
      providesTags: ["MoodCombinationInterpretation"],
    }),
  }),
});

export const { useGetZodiacInsightQuery, useGetMoodCombinationInterpretationQuery } = auraApi;
