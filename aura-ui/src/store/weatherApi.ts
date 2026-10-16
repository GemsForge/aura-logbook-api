// src/store/weatherApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { WeatherApi } from "../api/WeatherApi";
import type { WeatherDto } from "@/features/weather/WeatherDto";

export const weatherApi = createApi({
  reducerPath: "weatherApi",
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_BASE_URL }),
  tagTypes: ["Weather"],
  endpoints: (builder) => ({
    getCurrentWeather: builder.query<
      WeatherDto,
      {
        lat?: number;
        lon?: number;
        city?: string;
        state?: string;
        country?: string;
      }
    >({
      // instead of `query: () => ...` we use `queryFn` to call your existing axios-based API
      async queryFn(params) {
        try {
          const data = await WeatherApi.getCurrent(params);
          return { data };
        } catch (err: unknown) {
          const error = err instanceof Error ? err : new Error("Weather request failed");
          const response = typeof err === "object" && err !== null && "response" in err
            ? (err as { response?: { status?: number; data?: unknown } }).response
            : undefined;
          // RTKQ expects you to return `{ error: { status, data } }`
          return {
            error: {
              status: response?.status ?? 500,
              data: response?.data ?? error.message,
            },
          };
        }
      },
      // this lets RTKQ cache by each unique set of params
      providesTags: (args) => [
        { type: "Weather", id: JSON.stringify(args) },
      ],
      // optionally tune how long unused data sticks around
      keepUnusedDataFor: 600, // seconds
    }),
  }),
});

// auto-generated hook you’ll use in your component
export const { useGetCurrentWeatherQuery } = weatherApi;
