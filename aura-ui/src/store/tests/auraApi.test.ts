import { configureStore } from "@reduxjs/toolkit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodiacApi } from "@/api/ZodiacApi";
import type { ZodiacInsightResponse } from "@/features/zodiac/models/ZodiacInsightResponse";
import { auraApi } from "../auraApi";

vi.mock("@/api/ZodiacApi", () => ({
  ZodiacApi: {
    getInsight: vi.fn(),
  },
}));

function createTestStore() {
  return configureStore({
    reducer: {
      [auraApi.reducerPath]: auraApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(auraApi.middleware),
  });
}

const mockedZodiacApi = vi.mocked(ZodiacApi);

const testData = {
  zodiacInsight: {
    sign: "Virgo",
    insight: "Ground your ideas before expanding them.",
  } as unknown as ZodiacInsightResponse,
};

describe("auraApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should cache the zodiac insight response", async () => {
    mockedZodiacApi.getInsight.mockResolvedValue(testData.zodiacInsight);
    const store = createTestStore();

    const firstResult = await store.dispatch(
      auraApi.endpoints.getZodiacInsight.initiate()
    );
    const secondResult = await store.dispatch(
      auraApi.endpoints.getZodiacInsight.initiate()
    );

    expect(firstResult.data).toEqual(testData.zodiacInsight);
    expect(secondResult.data).toEqual(testData.zodiacInsight);
    expect(mockedZodiacApi.getInsight).toHaveBeenCalledTimes(1);
  });

  it("should store cached zodiac insight data in the RTK Query cache", async () => {
    mockedZodiacApi.getInsight.mockResolvedValue(testData.zodiacInsight);
    const store = createTestStore();

    await store.dispatch(auraApi.endpoints.getZodiacInsight.initiate());

    const queryCacheEntries = Object.values(
      store.getState()[auraApi.reducerPath].queries
    );

    expect(queryCacheEntries).toHaveLength(1);
    expect(queryCacheEntries[0]?.status).toBe("fulfilled");
    expect(queryCacheEntries[0]?.data).toEqual(testData.zodiacInsight);
  });
});