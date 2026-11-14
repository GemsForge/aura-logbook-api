// src/store/auraApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ZodiacApi } from "@/api/ZodiacApi";
import type { ZodiacInsightResponse } from "@/features/zodiac/models/ZodiacInsightResponse";
import type { RootState } from "./store";
import type { MoodType } from "@/features/mood/models/schema/MoodType";

/** `GET /api/aura/current`: OKLCH tone plus plain-language contributors (#343). */
export type DerivedAura = {
  hue: number | null;
  chroma: number;
  lightness: number;
  strength: number;
  intensity: number;
  contributors: string[];
};

/** Named season reflection and date spans returned by `GET /api/aura/seasons` (#346). */
export type AuraSeasonResponse = {
  current: { key: string; name: string; oftenLinkedWith: string; prompt: string; nextStep: string } | null;
  history: Array<{ key: string; name: string; startedOn: string; endedOn: string | null }>;
};

/** Neutral, Aura-authored daily reflection returned independently of a religious framework. */
export type FaithWordOfDay = { date: string; word: string; reflection: string };

/** One passage and its attribution for the single framework explicitly selected in Profile. */
export type SacredPassage = {
  framework: "christian" | "muslim" | "jewish";
  reference: string;
  text: string;
  translation: string;
  attribution: string;
  readingUrl: string;
};

/** One chapter/section segment; Arabic source text can accompany its translation. */
export type SacredTextSegment = { reference: string; text: string; sourceText?: string | null };

/** Provider section with stable source-version and per-language direction metadata. */
export type SacredTextSection = {
  framework: "christian" | "muslim" | "jewish";
  reference: string;
  translation: string;
  sourceVersion: string;
  attribution: string;
  readingUrl: string;
  textLanguage: string;
  textDirection: "ltr" | "rtl";
  sourceLanguage?: string | null;
  sourceDirection?: "ltr" | "rtl" | null;
  segments: SacredTextSegment[];
};

/** Persisted private note, highlight, or bookmark with a version-specific text-position anchor. */
export type SacredTextAnnotation = {
  id: number;
  framework: "christian" | "muslim" | "jewish";
  sectionReference: string;
  sourceVersion: string;
  language: string;
  kind: "highlight" | "note" | "bookmark";
  startOffset: number;
  endOffset: number;
  segmentReference?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Owner-authored annotation fields accepted by `POST/PUT /api/faith/annotations`. */
export type SacredTextAnnotationInput = Omit<SacredTextAnnotation, "id" | "createdAt" | "updatedAt" | "framework"> & {
  framework: SacredTextAnnotation["framework"];
};

/** The only mutable field after a reader annotation has been anchored. */
export type SacredTextAnnotationUpdate = Pick<SacredTextAnnotation, "note">;

/** Pathway reflection returned for one exact selected mood combination. */
export type MoodCombinationInterpretation = {
  combinationId: string;
  moods: string[];
  pathwayKey: number;
  interpretation: string;
  /** OKLCH hue authored for this combination (#345), or null/absent when none. */
  hue?: number | null;
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
  tagTypes: ["Zodiac", "MoodCombinationInterpretation", "Aura", "AuraSeasons", "FaithContent", "SacredTextAnnotations"],
  endpoints: (build) => ({
    /** Derived aura (#343); refetched on mount so new check-ins show up. */
    getCurrentAura: build.query<DerivedAura, void>({
      query: () => "/aura/current",
      providesTags: ["Aura"],
    }),
    /** Held named season and season history (#346); respects the account's reveal preference. */
    getAuraSeasons: build.query<AuraSeasonResponse, void>({
      query: () => "/aura/seasons",
      providesTags: ["AuraSeasons"],
    }),
    /** Neutral Word of the Day; does not depend on or reveal a selected framework. */
    getFaithWordOfDay: build.query<FaithWordOfDay, void>({
      query: () => "/faith/word-of-day",
      providesTags: ["FaithContent"],
    }),
    /** Requests only the passage for the explicitly selected supported framework. */
    getSacredPassage: build.query<SacredPassage | null, "christian" | "muslim" | "jewish">({
      query: (framework) => ({ url: "/faith/passage", params: { framework } }),
      providesTags: ["FaithContent"],
    }),
    /** Loads a navigable chapter/section through the selected framework's server-side provider. */
    getSacredTextSection: build.query<SacredTextSection, { framework: SacredPassage["framework"]; reference: string }>({
      query: ({ framework, reference }) => ({ url: "/faith/section", params: { framework, reference } }),
      providesTags: ["FaithContent"],
    }),
    /** Lists private reader annotations for the signed-in owner and one selected framework. */
    getSacredTextAnnotations: build.query<SacredTextAnnotation[], SacredPassage["framework"]>({
      query: (framework) => ({ url: "/faith/annotations", params: { framework } }),
      providesTags: ["SacredTextAnnotations"],
    }),
    /** Saves a private note, highlight, or bookmark. */
    createSacredTextAnnotation: build.mutation<SacredTextAnnotation, SacredTextAnnotationInput>({
      query: (body) => ({ url: "/faith/annotations", method: "POST", body }),
      invalidatesTags: ["SacredTextAnnotations"],
    }),
    /** Updates one private note or anchor through the owner-scoped API. */
    updateSacredTextAnnotation: build.mutation<void, { id: number; body: SacredTextAnnotationUpdate }>({
      query: ({ id, body }) => ({ url: `/faith/annotations/${id}`, method: "PUT", body }),
      invalidatesTags: ["SacredTextAnnotations"],
    }),
    /** Deletes one private reader annotation. */
    deleteSacredTextAnnotation: build.mutation<void, number>({
      query: (id) => ({ url: `/faith/annotations/${id}`, method: "DELETE" }),
      invalidatesTags: ["SacredTextAnnotations"],
    }),
    getZodiacInsight: build.query<ZodiacInsightResponse, void>({
      /** Loads the zodiac insight through the shared API client. */
      async queryFn() {
        try {
          const data = await ZodiacApi.getInsight();
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
      providesTags: ["Zodiac"],
      keepUnusedDataFor: 600,
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

export const {
  useGetZodiacInsightQuery,
  useGetMoodCombinationInterpretationQuery,
  useGetCurrentAuraQuery,
  useGetAuraSeasonsQuery,
  useGetFaithWordOfDayQuery,
  useGetSacredPassageQuery,
  useGetSacredTextSectionQuery,
  useGetSacredTextAnnotationsQuery,
  useCreateSacredTextAnnotationMutation,
  useUpdateSacredTextAnnotationMutation,
  useDeleteSacredTextAnnotationMutation,
} = auraApi;
