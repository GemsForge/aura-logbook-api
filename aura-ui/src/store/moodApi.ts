// src/store/moodApi.ts
import type { MoodByDate } from "@/components/dashboard/MoodTimeLineChart";
import type {
  MoodDashboardSummary,
  MoodEntry,
  MoodEntryRequest,
  MoodFrequencyResponse,
} from "@/features/mood/models/schema"; // adjust paths as needed
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logout } from "./slices/authSlice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL + "/Mood",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as any).auth.token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

const baseQueryWithLogout: typeof rawBaseQuery = async (
  args,
  api,
  extraOptions
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (
    result.error &&
    (result.error.status === 401 || result.error.status === 403)
  ) {
    api.dispatch(logout());
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }
  return result;
};

export const moodApi = createApi({
  reducerPath: "moodApi",
  baseQuery: baseQueryWithLogout,
  tagTypes: ["Moods", "Dashboard"],
  endpoints: (build) => ({
    // GET /Mood?startDate=&endDate=
    /** GET /Mood?startDate=&endDate= */
    getAllMoods: build.query<
      MoodEntry[],
      { startDate?: string; endDate?: string } | void
    >({
      query: (args) => ({ url: "", params: args ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Moods" as const, id })),
              { type: "Moods" as const, id: "LIST" },
            ]
          : [{ type: "Moods" as const, id: "LIST" }],
    }),

    // POST /Mood
    logMood: build.mutation<string, MoodEntryRequest>({
      query: (body) => ({
        url: "/",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Moods", id: "LIST" }, "Dashboard"],
    }),

    // GET /Mood/{id}
    getMoodById: build.query<MoodEntry, number>({
      query: (id) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Moods", id }],
    }),

    // PUT /Mood/{id}
    updateMood: build.mutation<
      string,
      { id: number; payload: MoodEntryRequest }
    >({
      query: ({ id, payload }) => ({
        url: `/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Moods", id },
        { type: "Moods", id: "LIST" },
        "Dashboard",
      ],
    }),

    // DELETE /Mood/{id}
    deleteMood: build.mutation<string, number>({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Moods", id: "LIST" }, "Dashboard"],
    }),

    // GET /Mood/dashboard/summary
    getDashboardSummary: build.query<MoodDashboardSummary, void>({
      query: () => "/dashboard/summary",
      providesTags: ["Dashboard"],
    }),

    /** GET /Mood/dashboard/moods-by-date?range=7d */
    getMoodsByDateRange: build.query<MoodByDate[], string>({
      query: (range = "7d") => ({
        url: "/dashboard/moods-by-date",
        params: { range },
      }),
      transformResponse: (response: Record<string, number>) =>
        Object.entries(response).map(([date, count]) => ({ date, count })),
    }),

    // GET /Mood/dashboard/mood-breakdown?percent=true
    getMoodBreakdown: build.query<MoodFrequencyResponse[], boolean>({
      query: (percent = false) => ({
        url: "/dashboard/mood-breakdown",
        params: { percent },
      }),
      providesTags: ["Dashboard"],
    }),

    // POST /Mood/seed-test-data?days=30  (DEV only)
    seedTestData: build.mutation<string, number>({
      query: (days = 30) => ({
        url: "/seed-test-data",
        method: "POST",
        params: { days },
      }),
      invalidatesTags: [{ type: "Moods", id: "LIST" }, "Dashboard"],
    }),
  }),
});

export const {
  useGetAllMoodsQuery,
  useLogMoodMutation,
  useGetMoodByIdQuery,
  useUpdateMoodMutation,
  useDeleteMoodMutation,
  useGetDashboardSummaryQuery,
  useGetMoodsByDateRangeQuery,
  useGetMoodBreakdownQuery,
  useSeedTestDataMutation,
} = moodApi;
