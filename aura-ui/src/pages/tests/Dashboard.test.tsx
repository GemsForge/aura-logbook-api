import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  createAuthenticatedState,
  renderWithProviders,
} from "../../test/testUtilities";
import Dashboard from "../Dashboard";

const dashboardSummary = vi.hoisted(() => ({
  data: {
    totalEntries: 12,
    mostFrequentMood: "Calm",
    currentStreak: 4,
    lastEntryDate: "2025-06-18" as string | null,
  },
}));
const dashboardPathway = vi.hoisted(() => ({ selectedPathway: "Mindfulness" }));
const quickMoodMutation = vi.hoisted(() => vi.fn());

// This mocks useAppSelector
vi.mock("../../store/hooks", async () => {
  const actual = await vi.importActual<typeof import("../../store/hooks")>(
    "../../store/hooks"
  );

  return {
    ...actual,
    useAppSelector: () => ({
      displayName: "Gem",
      auraColor: "blue",
      selectedPathway: dashboardPathway.selectedPathway,
    }),
  };
});

// This mocks useGetCurrentUserQuery
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

// This mocks all the moodApi hooks used in the Dashboard
vi.mock("../../store/moodApi", () => ({
  useGetAllMoodsQuery: () => ({
    isLoading: false,
    data: [],
  }),
  useGetDashboardSummaryQuery: () => ({
    isLoading: false,
    data: dashboardSummary.data,
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
  useLogMoodMutation: () => [quickMoodMutation, { isLoading: false }],
}));

// This mocks the zodiacApi hook used in the Dashboard
vi.mock("../../store/auraApi", () => ({
  useGetZodiacInsightQuery: (_arg: unknown, options?: { skip?: boolean }) => options?.skip ? ({
    isLoading: false,
  }) : ({
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

// Mock the child components used in the Dashboard
vi.mock("../../components/weather/WeatherCard", () => ({
  default: () => <div data-testid="weather-card">Weather Card</div>,
}));

// Mock the chart components to avoid rendering actual charts in the test
vi.mock("../../components/dashboard/MoodPieChart", () => ({
  default: () => <div data-testid="mood-pie-chart">Mood Pie Chart</div>,
}));

// Mock the MoodStatCard to display the title and value for testing purposes
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

vi.mock("../../components/profile/SpotifyConnectionCard", () => ({
  default: () => <div data-testid="spotify-connection-card">Spotify Connection</div>,
}));

vi.mock("../../util/timeGreeting", () => ({
  getTimeGreeting: () => "Good morning",
}));

describe("Dashboard", () => {
  it("prioritizes the check-in, week, prompt, and recent reflections on the mindful pathway", () => {
    dashboardPathway.selectedPathway = "Mindfulness";
    renderWithProviders(<Dashboard />, {
      preloadedState: createAuthenticatedState(),
    });

    expect(screen.getByText(/good morning, gem\./i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /log your mood/i })).toHaveAttribute("href", "/log-mood");
    expect(screen.getByRole("heading", { name: /how are you feeling today/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /this week/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /a thought for today/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /recent reflections/i })).toBeInTheDocument();
    expect(screen.getByText(/mindful pathway/i)).toBeInTheDocument();
    expect(screen.queryByText(/virgo • earth/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("weather-card")).toBeInTheDocument();
    expect(screen.getByTestId("mood-pie-chart")).toBeInTheDocument();
    expect(screen.getAllByTestId("mood-timeline-chart")).toHaveLength(2);
    expect(screen.getByText(/12 entries · most often Calm/i)).toBeInTheDocument();
    expect(screen.getByText("Music")).toBeInTheDocument();
    expect(screen.getByTestId("spotify-connection-card").closest("details")).not.toHaveAttribute("open");
  });

  it("shows celestial insight only on the Astrology & Energy pathway", () => {
    dashboardPathway.selectedPathway = "Energy";

    renderWithProviders(<Dashboard />, {
      preloadedState: createAuthenticatedState(),
    });

    expect(screen.getByText(/virgo • earth/i)).toBeInTheDocument();
    expect(screen.getByText(/grounded, reflective energy/i)).toBeInTheDocument();
    expect(screen.getAllByText(/take your time and trust your rhythm/i).length).toBeGreaterThan(0);
  });

  it("shows a gentle empty summary without a streak when there are no entries", () => {
    dashboardPathway.selectedPathway = "Mindfulness";
    dashboardSummary.data.totalEntries = 0;
    dashboardSummary.data.mostFrequentMood = "";
    renderWithProviders(<Dashboard />, { preloadedState: createAuthenticatedState() });
    expect(screen.getByText(/no check-ins yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/streak/i)).not.toBeInTheDocument();
  });

  it("saves one selected quick mood and announces the saved state", async () => {
    dashboardPathway.selectedPathway = "Mindfulness";
    quickMoodMutation.mockReset().mockReturnValue({ unwrap: () => Promise.resolve({ id: 42, message: "Saved" }) });
    const user = userEvent.setup();
    renderWithProviders(<Dashboard />, { preloadedState: createAuthenticatedState() });
    await user.click(screen.getByRole("button", { name: "Empowered" }));
    expect(quickMoodMutation).toHaveBeenCalledWith(expect.objectContaining({ moods: ["Empowered"] }));
    expect(await screen.findByText(/logged\. thank you for checking in/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add more detail/i })).toBeInTheDocument();
  });

  it("shows an inline retry after a failed quick mood save", async () => {
    dashboardPathway.selectedPathway = "Mindfulness";
    quickMoodMutation.mockReset().mockReturnValue({ unwrap: () => Promise.reject(new Error("offline")) });
    const user = userEvent.setup();
    renderWithProviders(<Dashboard />, { preloadedState: createAuthenticatedState() });
    await user.click(screen.getByRole("button", { name: "Centered" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/didn’t save/i);
    expect(screen.getByRole("button", { name: /retry centered/i })).toBeInTheDocument();
  });
});
