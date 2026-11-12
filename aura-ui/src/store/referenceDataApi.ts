import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { AuraColorDefinition } from "@/features/mood/models/aura";

/** Stable API contract for an editable reference definition. */
export interface ReferenceDefinition {
  key: string;
  displayName: string;
  description: string;
  sortOrder: number;
}

/** Database-managed color palette used to build an aura theme. */
/** Database-managed mood copy, illustration path, and aura-color association. */
export interface MoodDefinition extends ReferenceDefinition {
  /** Public UI path stored in MoodDefinitions.Icon, such as /mood-icons/centered.png. */
  icon: string;
  /** Activation from 1 (low) to 5 (high) for the aura ribbon and average energy; never a good/bad score. Optional for older API responses. */
  energyLevel?: number;
  auraColorKeys: string[];
}

/** Database-managed design token. */
export interface ThemeToken {
  key: string;
  value: string;
  category: string;
}

/** Metadata for a static graphic hosted by the UI application. */
export interface GraphicAsset {
  key: string;
  path: string;
  displayName: string;
  alternativeText: string;
  assetType: string;
}

/** Database-managed zodiac symbol used by profile and insight surfaces. */
export interface ZodiacSignDefinition {
  key: string;
  description: string;
  element: string;
  symbol: string;
}

/** Full configuration fetched before rendering app screens. */
export interface ReferenceDataConfiguration {
  pathways: ReferenceDefinition[];
  auras: AuraColorDefinition[];
  chakras: ReferenceDefinition[];
  moods: MoodDefinition[];
  themeTokens: ThemeToken[];
  graphics: GraphicAsset[];
  zodiacSigns: ZodiacSignDefinition[];
}

export const referenceDataApi = createApi({
  reducerPath: "referenceDataApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL || (typeof window === "undefined" ? "http://localhost" : window.location.origin),
  }),
  tagTypes: ["AuraColors", "ReferenceData"],
  endpoints: (build) => ({
    getReferenceData: build.query<ReferenceDataConfiguration, void>({
      query: () => "/reference-data",
      providesTags: ["ReferenceData"],
      keepUnusedDataFor: 600,
    }),
    getAuraColors: build.query<AuraColorDefinition[], void>({
      query: () => "/reference-data/auras",
      providesTags: ["AuraColors"],
      keepUnusedDataFor: 600,
    }),
  }),
});

export const { useGetAuraColorsQuery, useGetReferenceDataQuery } = referenceDataApi;
