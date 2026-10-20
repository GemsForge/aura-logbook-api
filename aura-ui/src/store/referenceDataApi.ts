import type { AuraColorDefinition } from "@/features/mood/models/aura";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const referenceDataApi = createApi({
  reducerPath: "referenceDataApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL,
  }),
  tagTypes: ["AuraColors"],
  endpoints: (build) => ({
    getAuraColors: build.query<AuraColorDefinition[], void>({
      query: () => "/reference-data/auras",
      providesTags: ["AuraColors"],
      keepUnusedDataFor: 600,
    }),
  }),
});

export const { useGetAuraColorsQuery } = referenceDataApi;
