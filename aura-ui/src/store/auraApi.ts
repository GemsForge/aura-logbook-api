// src/store/auraApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ZodiacApi } from "@/api/ZodiacApi";
import type { ZodiacInsightResponse } from "@/features/zodiac/models/ZodiacInsightResponse";

export const auraApi = createApi({
  reducerPath: "auraApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL,
  }),
  tagTypes: ["Zodiac"],
  endpoints: (build) => ({
    getZodiacInsight: build.query<ZodiacInsightResponse, void>({
      // instead of build.query({ query: ... }), we call our existing Axios wrapper:
      async queryFn(_arg, _queryApi, _extraOptions) {
        try {
          const data = await ZodiacApi.getInsight(); // your existing client method :contentReference[oaicite:0]{index=0}
          return { data };
        } catch (err: any) {
          return {
            error: {
              status: err.response?.status,
              data: err.response?.data ?? err.message,
            },
          };
        }
      },
      providesTags: ["Zodiac"], // so you can later invalidate it
      keepUnusedDataFor: 600, // seconds in cache
    }),
    // …other endpoints here…
  }),
});

export const { useGetZodiacInsightQuery } = auraApi;
