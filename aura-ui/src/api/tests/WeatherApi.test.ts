import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { WeatherApi } from "../WeatherApi";
import api from "../api";
import type { WeatherDto } from "../../features/weather/WeatherDto";

vi.mock("../api", () => ({
  default: {
    get: vi.fn(),
  },
}));

type MockedApiClient = {
  get: Mock;
};

const mockedApi = api as unknown as MockedApiClient;

const testData = {
  locationParams: {
    city: "Atlanta",
    state: "GA",
    country: "US",
  },
  coordinateParams: {
    lat: 33.749,
    lon: -84.388,
  },
  weatherResponse: {
    location: "Atlanta, GA",
    temperature: 78,
    condition: "Clear",
  } as unknown as WeatherDto,
};

describe("WeatherApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should get current weather by location params", async () => {
    mockedApi.get.mockResolvedValue({ data: testData.weatherResponse });

    const result = await WeatherApi.getCurrent(testData.locationParams);

    expect(mockedApi.get).toHaveBeenCalledWith("/Weather/current", {
      params: testData.locationParams,
    });
    expect(result).toEqual(testData.weatherResponse);
  });

  it("should get current weather by coordinates", async () => {
    mockedApi.get.mockResolvedValue({ data: testData.weatherResponse });

    const result = await WeatherApi.getCurrent(testData.coordinateParams);

    expect(mockedApi.get).toHaveBeenCalledWith("/Weather/current", {
      params: testData.coordinateParams,
    });
    expect(result).toEqual(testData.weatherResponse);
  });
});
