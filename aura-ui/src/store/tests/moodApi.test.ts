

import { configureStore } from "@reduxjs/toolkit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MoodByDate } from "@/components/dashboard/MoodTimeLineChart";
import type {
  MoodDashboardSummary,
  MoodEntry,
  MoodFrequencyResponse,
} from "@/features/mood/models/schema";
import { moodApi } from "../moodApi";
import authReducer from "../slices/authSlice";

function createJsonResponse<T>(data: T) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function createTestStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      [moodApi.reducerPath]: moodApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(moodApi.middleware),
  });
}

const testData = {
  moodEntries: [
    {
      id: 1,
      userId: 1,
      date: "2025-06-18",
      moods: [1, 4],
      comment: "Feeling grounded.",
      createdAt: "2025-06-18T14:38:13Z",
    },
  ] as unknown as MoodEntry[],
  dateRange: {
    startDate: "2025-06-01",
    endDate: "2025-06-30",
  },
  dashboardSummary: {
    totalEntries: 3,
    currentStreak: 2,
    longestStreak: 5,
  } as unknown as MoodDashboardSummary,
  moodsByDateResponse: {
    "2025-06-18": 2,
    "2025-06-19": 1,
  },
  transformedMoodsByDate: [
    { date: "2025-06-18", count: 2 },
    { date: "2025-06-19", count: 1 },
  ] as MoodByDate[],
  moodBreakdown: [
    {
      mood: "Calm",
      count: 2,
      percent: 50,
    },
  ] as unknown as MoodFrequencyResponse[],
};

describe("moodApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should cache the mood history response for the same date range", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(createJsonResponse(testData.moodEntries));
    const store = createTestStore();

    const firstResult = await store.dispatch(
      moodApi.endpoints.getAllMoods.initiate(testData.dateRange)
    );
    const secondResult = await store.dispatch(
      moodApi.endpoints.getAllMoods.initiate(testData.dateRange)
    );

    expect(firstResult.data).toEqual(testData.moodEntries);
    expect(secondResult.data).toEqual(testData.moodEntries);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("should cache a single mood entry by id", async () => {
    const moodEntry = testData.moodEntries[0];
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(createJsonResponse(moodEntry));
    const store = createTestStore();

    const firstResult = await store.dispatch(
      moodApi.endpoints.getMoodById.initiate(1)
    );
    const secondResult = await store.dispatch(
      moodApi.endpoints.getMoodById.initiate(1)
    );

    expect(firstResult.data).toEqual(moodEntry);
    expect(secondResult.data).toEqual(moodEntry);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("should cache the dashboard summary response", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(createJsonResponse(testData.dashboardSummary));
    const store = createTestStore();

    const firstResult = await store.dispatch(
      moodApi.endpoints.getDashboardSummary.initiate()
    );
    const secondResult = await store.dispatch(
      moodApi.endpoints.getDashboardSummary.initiate()
    );

    expect(firstResult.data).toEqual(testData.dashboardSummary);
    expect(secondResult.data).toEqual(testData.dashboardSummary);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("should transform and cache moods-by-date data", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(createJsonResponse(testData.moodsByDateResponse));
    const store = createTestStore();

    const firstResult = await store.dispatch(
      moodApi.endpoints.getMoodsByDateRange.initiate("7d")
    );
    const secondResult = await store.dispatch(
      moodApi.endpoints.getMoodsByDateRange.initiate("7d")
    );

    expect(firstResult.data).toEqual(testData.transformedMoodsByDate);
    expect(secondResult.data).toEqual(testData.transformedMoodsByDate);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("should cache the mood breakdown response", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(createJsonResponse(testData.moodBreakdown));
    const store = createTestStore();

    const firstResult = await store.dispatch(
      moodApi.endpoints.getMoodBreakdown.initiate(true)
    );
    const secondResult = await store.dispatch(
      moodApi.endpoints.getMoodBreakdown.initiate(true)
    );

    expect(firstResult.data).toEqual(testData.moodBreakdown);
    expect(secondResult.data).toEqual(testData.moodBreakdown);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("should store fulfilled mood queries in the RTK Query cache", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createJsonResponse(testData.moodEntries)
    );
    const store = createTestStore();

    await store.dispatch(moodApi.endpoints.getAllMoods.initiate());

    const queryCacheEntries = Object.values(
      store.getState()[moodApi.reducerPath].queries
    );

    expect(queryCacheEntries).toHaveLength(1);
    expect(queryCacheEntries[0]?.status).toBe("fulfilled");
    expect(queryCacheEntries[0]?.data).toEqual(testData.moodEntries);
  });
});