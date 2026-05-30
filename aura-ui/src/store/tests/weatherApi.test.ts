import { configureStore } from "@reduxjs/toolkit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WeatherDto } from "@/features/weather/WeatherDto";
import { WeatherApi } from "../../api/WeatherApi";
import { weatherApi } from "../weatherApi";

vi.mock("../../api/WeatherApi", () => ({
  WeatherApi: {
    getCurrent: vi.fn(),
  },
}));

function createTestStore() {
  return configureStore({
    reducer: {
      [weatherApi.reducerPath]: weatherApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(weatherApi.middleware),
  });
}

const mockedWeatherApi = vi.mocked(WeatherApi);

const testData = {
  weatherParams: {
    city: "Atlanta",
    state: "GA",
    country: "US",
  },
  weatherResponse: {
    location: "Atlanta, GA",
    temperature: 78,
    condition: "Clear",
  } as unknown as WeatherDto,
};

describe("weatherApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should cache the current weather response", async () => {
    mockedWeatherApi.getCurrent.mockResolvedValue(testData.weatherResponse);
    const store = createTestStore();

    const firstResult = await store.dispatch(
      weatherApi.endpoints.getCurrentWeather.initiate(testData.weatherParams)
    );
    const secondResult = await store.dispatch(
      weatherApi.endpoints.getCurrentWeather.initiate(testData.weatherParams)
    );

    expect(firstResult.data).toEqual(testData.weatherResponse);
    expect(secondResult.data).toEqual(testData.weatherResponse);
    expect(mockedWeatherApi.getCurrent).toHaveBeenCalledTimes(1);
    expect(mockedWeatherApi.getCurrent).toHaveBeenCalledWith(
      testData.weatherParams
    );
  });

  it("should store cached current weather data in the RTK Query cache", async () => {
    mockedWeatherApi.getCurrent.mockResolvedValue(testData.weatherResponse);
    const store = createTestStore();

    await store.dispatch(
      weatherApi.endpoints.getCurrentWeather.initiate(testData.weatherParams)
    );

    const queryCacheEntries = Object.values(
      store.getState()[weatherApi.reducerPath].queries
    );

    expect(queryCacheEntries).toHaveLength(1);
    expect(queryCacheEntries[0]?.status).toBe("fulfilled");
    expect(queryCacheEntries[0]?.data).toEqual(testData.weatherResponse);
  });
});
