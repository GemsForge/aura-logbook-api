import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  createAuthenticatedState,
  renderWithProviders,
} from "../../test/testUtilities";
import Dashboard from "../Dashboard";

vi.mock("../../store/hooks", async () => {
  const actual = await vi.importActual<typeof import("../../store/hooks")>(
    "../../store/hooks"
  );

  return {
    ...actual,
    useAppSelector: () => ({
      displayName: "Gem",
      auraColor: "blue",
      selectedPathway: "Mindfulness",
    }),
  };
});

vi.mock("../../store/authApi", async () => {
  const actual = await vi.importActual<typeof import("../../store/authApi")>(
    "../../store/authApi"
  );

  return {
    ...actual,
    useGetCurrentUserQuery: () => ({
      isLoading: false,
    }),
  };
});

vi.mock("../../store/moodApi", () => ({
  useGetDashboardSummaryQuery: () => ({
    isLoading: false,
    data: {
      totalEntries: 12,
      mostFrequentMood: "Calm",
      currentStreak: 4,
      lastEntryDate: "2025-06-18",
    },
  }),
  useGetMoodBreakdownQuery: () => ({
    isLoading: false,
    data: [
      {
        mood: "Calm",
        count: 5,
        percent: 42,
      },
    ],
  }),
  useGetMoodsByDateRangeQuery: () => ({
    isLoading: false,
    data: [
      {
        date: "2025-06-18",
        count: 2,
      },
    ],
  }),
}));

vi.mock("../../store/auraApi", () => ({
  useGetZodiacInsightQuery: () => ({
    isLoading: false,
    data: {
      sign: "Virgo",
      element: "Earth",
      description: "Grounded, reflective energy.",
      insights: [
        {
          message: "Take your time and trust your rhythm.",
        },
      ],
    },
  }),
}));

vi.mock("../../components/weather/WeatherCard", () => ({
  default: () => <div data-testid="weather-card">Weather Card</div>,
}));

vi.mock("../../components/dashboard/MoodPieChart", () => ({
  default: () => <div data-testid="mood-pie-chart">Mood Pie Chart</div>,
}));

vi.mock("../../components/dashboard/MoodStatCard", () => ({
  default: ({ title, value }: { title: string; value: string }) => (
    <div data-testid="mood-stat-card">
      <span>{title}</span>
      <span>{value}</span>
    </div>
  ),
}));

vi.mock("../../components/dashboard/MoodTimeLineChart", () => ({
  default: () => <div data-testid="mood-timeline-chart">Mood Timeline Chart</div>,
}));

vi.mock("../../util/timeGreeting", () => ({
  getTimeGreeting: () => "Good morning",
}));

describe("Dashboard", () => {
  it("should render the dashboard with user, mood, weather, and zodiac sections", () => {
    renderWithProviders(<Dashboard />, {
      preloadedState: createAuthenticatedState(),
    });

    expect(screen.getByText(/good morning, gem!/i)).toBeInTheDocument();
    expect(screen.getByText(/my pathway/i)).toBeInTheDocument();
    expect(screen.getByText(/mindfulness/i)).toBeInTheDocument();
    expect(screen.getByText(/virgo • earth/i)).toBeInTheDocument();
    expect(screen.getByText(/grounded, reflective energy/i)).toBeInTheDocument();
    expect(screen.getByText(/take your time and trust your rhythm/i)).toBeInTheDocument();
    expect(screen.getByText(/total entries/i)).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText(/most frequent mood/i)).toBeInTheDocument();
    expect(screen.getAllByText(/calm/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/current streak/i)).toBeInTheDocument();
    expect(screen.getByText(/4 days/i)).toBeInTheDocument();
    expect(screen.getByText(/last entry/i)).toBeInTheDocument();
    expect(screen.getByTestId("weather-card")).toBeInTheDocument();
    expect(screen.getByTestId("mood-pie-chart")).toBeInTheDocument();
    expect(screen.getByTestId("mood-timeline-chart")).toBeInTheDocument();
  });
});