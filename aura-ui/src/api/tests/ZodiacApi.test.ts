import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { ZodiacApi } from "../ZodiacApi";
import api from "../api";
import type { ZodiacInsightResponse } from "../../features/zodiac/models/ZodiacInsightResponse";

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
  zodiacInsight: {
    sign: "Virgo",
    insight: "Ground your ideas before expanding them.",
  } as unknown as ZodiacInsightResponse,
};

describe("ZodiacApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should get the zodiac insight", async () => {
    mockedApi.get.mockResolvedValue({ data: testData.zodiacInsight });

    const result = await ZodiacApi.getInsight();

    expect(mockedApi.get).toHaveBeenCalledWith("insights/zodiac");
    expect(result).toEqual(testData.zodiacInsight);
  });
});
