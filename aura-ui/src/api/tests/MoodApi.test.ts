import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { MoodApi } from "../MoodApi";
import api from "../api";
import type {
  MoodDashboardSummary,
  MoodEntryRequest,
  MoodFrequencyResponse,
} from "../../features/mood/models/schema/MoodAuth"
import type { MoodEntry } from "../../features/mood/models/schema/MoodEntry";

// Mock the api module to intercept HTTP requests and provide controlled responses for testing.
vi.mock("../api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

type MockedApiClient = {
  get: Mock;
  post: Mock;
  put: Mock;
  delete: Mock;
};

const mockedApi = api as unknown as MockedApiClient;

const testData = {
  moodEntry: {
    id: 1,
    userId: 1,
    date: "2025-06-18",
    moods: [1, 4],
    comment: "Feeling grounded.",
    createdAt: "2025-06-18T14:38:13Z",
  } as unknown as MoodEntry,
  moodPayload: {
    date: "2025-06-18",
    moods: [1, 4],
    comment: "Feeling grounded.",
  } as unknown as MoodEntryRequest,
  dashboardSummary: {
    totalEntries: 3,
    currentStreak: 2,
    longestStreak: 5,
  } as unknown as MoodDashboardSummary,
  moodBreakdown: [
    {
      mood: "Calm",
      count: 2,
      percent: 50,
    },
  ] as unknown as MoodFrequencyResponse[],
  moodsByDate: {
    "2025-06-18": 2,
    "2025-06-19": 1,
  },
};

describe("MoodApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should get all moods with optional date filters", async () => {
    const moods = [testData.moodEntry];
    mockedApi.get.mockResolvedValue({ data: moods });

    const result = await MoodApi.getAllMoods("2025-06-01", "2025-06-30");

    expect(mockedApi.get).toHaveBeenCalledWith("Mood", {
      params: {
        startDate: "2025-06-01",
        endDate: "2025-06-30",
      },
    });
    expect(result).toEqual(moods);
  });

  it("should log a new mood entry", async () => {
    const responseMessage = "Mood logged successfully.";
    mockedApi.post.mockResolvedValue({ data: responseMessage });

    const result = await MoodApi.logMood(testData.moodPayload);

    expect(mockedApi.post).toHaveBeenCalledWith("Mood", testData.moodPayload);
    expect(result).toBe(responseMessage);
  });

  it("should get a mood entry by id", async () => {
    mockedApi.get.mockResolvedValue({ data: testData.moodEntry });

    const result = await MoodApi.getById(1);

    expect(mockedApi.get).toHaveBeenCalledWith("Mood/1");
    expect(result).toEqual(testData.moodEntry);
  });

  it("should delete a mood entry by id", async () => {
    const responseMessage = "Mood deleted successfully.";
    mockedApi.delete.mockResolvedValue({ data: responseMessage });

    const result = await MoodApi.deleteMood(1);

    expect(mockedApi.delete).toHaveBeenCalledWith("Mood/1");
    expect(result).toBe(responseMessage);
  });

  it("should update a mood entry by id", async () => {
    const responseMessage = "Mood updated successfully.";
    mockedApi.put.mockResolvedValue({ data: responseMessage });

    const result = await MoodApi.updateMood(1, testData.moodPayload);

    expect(mockedApi.put).toHaveBeenCalledWith("Mood/1", testData.moodPayload);
    expect(result).toBe(responseMessage);
  });

  it("should get dashboard summary", async () => {
    mockedApi.get.mockResolvedValue({ data: testData.dashboardSummary });

    const result = await MoodApi.getDashboardSummary();

    expect(mockedApi.get).toHaveBeenCalledWith("Mood/dashboard/summary");
    expect(result).toEqual(testData.dashboardSummary);
  });

  it("should get moods by date range", async () => {
    mockedApi.get.mockResolvedValue({ data: testData.moodsByDate });

    const result = await MoodApi.getMoodsByDateRange("30d");

    expect(mockedApi.get).toHaveBeenCalledWith("Mood/dashboard/moods-by-date", {
      params: {
        range: "30d",
      },
    });
    expect(result).toEqual(testData.moodsByDate);
  });

  it("should get mood breakdown", async () => {
    mockedApi.get.mockResolvedValue({ data: testData.moodBreakdown });

    const result = await MoodApi.getMoodBreakdown(true);

    expect(mockedApi.get).toHaveBeenCalledWith("Mood/dashboard/mood-breakdown", {
      params: {
        percent: true,
      },
    });
    expect(result).toEqual(testData.moodBreakdown);
  });

  it("should seed test mood data", async () => {
    const responseMessage = "Seeded 30 days of mood data.";
    mockedApi.post.mockResolvedValue({ data: responseMessage });

    const result = await MoodApi.seedTestData(30);

    expect(mockedApi.post).toHaveBeenCalledWith("Mood/seed-test-data", null, {
      params: {
        days: 30,
      },
    });
    expect(result).toBe(responseMessage);
  });
});