import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAuthenticatedState,
  renderWithProviders,
} from "../../test/testUtilities";
import Dashboard from "../Dashboard";
import { testReferenceData } from "../../test/referenceDataFixtures";

vi.mock("@/store/referenceDataApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/store/referenceDataApi")>();
  return { ...actual, useGetReferenceDataQuery: () => ({ data: testReferenceData, isError: false }) };
});

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
  useGetMoodByIdQuery: (id: number) => ({
    data: id ? { id, userId: 7, date: "2026-11-10", moods: ["Empowered"], createdAt: "2026-11-10T12:30:00.000Z" } : undefined,
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
  useGetAuraSeasonsQuery: () => ({ data: { current: null, history: [] }, isLoading: false, isError: false, refetch: vi.fn() }),
  // #344: the dashboard header shows "Why this color?" from the derived aura.
  useGetCurrentAuraQuery: () => ({ data: { hue: null, chroma: 0.04, lightness: 0.72, strength: 0, intensity: 0, contributors: [] } }),
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
// Weather attached to check-ins comes from the cached weather query; stub it so the store module graph stays out of this test.
vi.mock("@/store/weatherApi", () => ({ useGetCurrentWeatherQuery: () => ({ data: undefined }) }));
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

vi.mock("../../components/MoodUpdateModal", () => ({
  default: ({ title, entry }: { title: string; entry: { id: number } }) => <div data-testid="mood-update-modal" data-entry-id={entry.id}>{title}</div>,
}));

vi.mock("../../util/timeGreeting", () => ({
  getTimeGreeting: () => "Good morning",
}));

describe("Dashboard", () => {
  beforeEach(() => {
    dashboardSummary.data.totalEntries = 12;
    dashboardSummary.data.mostFrequentMood = "Calm";
    dashboardSummary.data.lastEntryDate = "2025-06-18";
    dashboardPathway.selectedPathway = "Mindfulness";
    quickMoodMutation.mockReset();
  });

  it("prioritizes the check-in, week, prompt, and recent reflections on the mindful pathway", () => {
    dashboardPathway.selectedPathway = "Mindfulness";
    renderWithProviders(<Dashboard />, {
      preloadedState: createAuthenticatedState(),
    });

    expect(screen.getByText(/good morning, gem\./i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /how are you feeling today/i })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /how are you feeling today/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /this week/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /a thought for today/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /recent reflections/i })).toBeInTheDocument();
    expect(screen.queryByText(/virgo/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("weather-card")).toBeInTheDocument();
    // The breakdown chart lives on the Insights page, not Today.
    expect(screen.queryByTestId("mood-pie-chart")).not.toBeInTheDocument();
    expect(screen.getByRole("list", { name: /last seven days/i })).toBeInTheDocument();
    expect(screen.queryByTestId("mood-timeline-chart")).not.toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Your check-in stats" })).toHaveTextContent(/Entries12Most oftenCalm/);
    expect(screen.getByTestId("spotify-connection-card")).toBeInTheDocument();
    expect(screen.getByTestId("spotify-connection-card").closest("details")).toBeNull();
  });

  it("shows celestial insight only on the Astrology & Energy pathway", () => {
    dashboardPathway.selectedPathway = "Energy";

    renderWithProviders(<Dashboard />, {
      preloadedState: createAuthenticatedState(),
    });

    expect(screen.getByRole("heading", { name: /a lens for reflection/i })).toBeInTheDocument();
    expect(screen.getByText(/virgo · earth · take your time and trust your rhythm/i)).toBeInTheDocument();
  });

  it("shows the secondary check-in actions as buttons", () => {
    renderWithProviders(<Dashboard />, { preloadedState: createAuthenticatedState() });
    expect(screen.getByRole("button", { name: "More moods" })).toHaveClass("MuiButton-variantOutlined");
    expect(screen.getByRole("button", { name: "Add more detail" })).toHaveClass("MuiButton-variantOutlined");
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
    const quickMoodGroup = within(screen.getByRole("group", { name: "How are you feeling today?" }));
    expect(quickMoodGroup.getAllByRole("button").map((button) => button.getAttribute("aria-label")))
      .toEqual(testReferenceData.moods.map(({ displayName }) => displayName).sort((left, right) => left.localeCompare(right)).slice(0, 6));
    await user.click(screen.getByRole("button", { name: "Empowered" }));
    expect(quickMoodMutation).toHaveBeenCalledWith(expect.objectContaining({ moods: ["Empowered"] }));
    expect(await screen.findByText(/logged\. thank you for checking in/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add a note or photo/i })).toBeInTheDocument();
    expect(screen.getByText(/green reflection color/i)).toBeInTheDocument();
    expect(screen.getByText(/a gentle next step/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /add a note or photo/i }));
    expect(screen.getByTestId("mood-update-modal")).toHaveTextContent("Add a note or photo");
  });

  it("opens the saved entry for details instead of creating a second one", async () => {
    dashboardPathway.selectedPathway = "Mindfulness";
    quickMoodMutation.mockReset().mockReturnValue({ unwrap: () => Promise.resolve({ id: 42, message: "Saved" }) });
    const user = userEvent.setup();
    renderWithProviders(<Dashboard />, { preloadedState: createAuthenticatedState() });
    await user.click(screen.getByRole("button", { name: "Empowered" }));
    await user.click(await screen.findByRole("button", { name: /add a note or photo/i }));
    // The update dialog receives the entry the quick check-in created (id 42)...
    expect(screen.getByTestId("mood-update-modal")).toHaveAttribute("data-entry-id", "42");
    // ...and no second create request was made.
    expect(quickMoodMutation).toHaveBeenCalledTimes(1);
  });

  it("moves focus to the confirmation after saving and back to the chips on Done", async () => {
    dashboardPathway.selectedPathway = "Mindfulness";
    quickMoodMutation.mockReset().mockReturnValue({ unwrap: () => Promise.resolve({ id: 42, message: "Saved" }) });
    const user = userEvent.setup();
    renderWithProviders(<Dashboard />, { preloadedState: createAuthenticatedState() });
    // The live region exists before saving so its later text change is announced.
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    await user.click(screen.getByRole("button", { name: "Empowered" }));
    const saved = await screen.findByRole("group", { name: /check-in saved/i });
    expect(saved).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent(/logged empowered/i);
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.getByRole("group", { name: /how are you feeling today/i }).querySelector("button")).toHaveFocus();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("prevents duplicate requests from rapid taps", async () => {
    dashboardPathway.selectedPathway = "Mindfulness";
    let finishRequest!: (value: { id: number; message: string }) => void;
    quickMoodMutation.mockReturnValue({ unwrap: () => new Promise((resolve) => { finishRequest = resolve; }) });
    const user = userEvent.setup();
    renderWithProviders(<Dashboard />, { preloadedState: createAuthenticatedState() });
    const moodButton = screen.getByRole("button", { name: "Empowered" });
    await user.click(moodButton);
    expect(quickMoodMutation).toHaveBeenCalledTimes(1);
    expect(moodButton).toBeDisabled();
    finishRequest({ id: 42, message: "Saved" });
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
