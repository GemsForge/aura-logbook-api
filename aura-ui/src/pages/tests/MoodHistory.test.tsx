import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderWithProviders } from "../../test/testUtilities";
import MoodHistoryPage from "../../components/history/MoodHistory";
import { MoodApi } from "@/api/MoodApi";
import type { MoodType } from "@/features/mood/models/schema";

vi.mock("@/api/MoodApi", () => ({
  MoodApi: {
    getAllMoods: vi.fn(),
    deleteMood: vi.fn(),
  },
}));

vi.mock("../../hooks/useToast", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../hooks/useToast")>();

  return {
    ...actual,
    useToast: () => ({
      showToast: vi.fn(),
    }),
  };
});

vi.mock("@mui/x-date-pickers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mui/x-date-pickers")>();

  return {
    ...actual,
    DatePicker: ({ label }: { label: string }) => (
      <input aria-label={label} readOnly />
    ),
  };
});

vi.mock("../../components/history/MoodCard", () => ({
  MoodCard: ({ entry }: { entry: { comment?: string | null } }) => (
    <div data-testid="mood-card">{entry.comment ?? "Mood entry"}</div>
  ),
}));

vi.mock("../../components/MoodUpdateModal", () => ({
  default: () => <div data-testid="mood-update-modal">Mood Update Modal</div>,
}));

vi.mock("../../components/DeleteConfirmDialog", () => ({
  default: () => (
    <div data-testid="delete-confirm-dialog">Delete Confirm Dialog</div>
  ),
}));

const mockedMoodApi = vi.mocked(MoodApi);

const testData = {
  moodEntries: [
    {
      id: 1,
      userId: 1,
      date: "2025-06-18",
      moods: ["Harmonious", "Centered"] as MoodType[],
      comment: "Feeling grounded.",
      createdAt: "2025-06-18T14:38:13Z",
    },
  ],
};

describe("MoodHistoryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedMoodApi.getAllMoods.mockResolvedValue(testData.moodEntries);
  });

  /**
   * Smoke test for the Mood History page.
   *
   * This test checks that the page can load without crashing, shows the main
   * Mood History heading, displays the date filter controls, and renders at
   * least one mood card after the mocked mood history API call finishes.
   *
   * The real MoodCard, date picker internals, delete dialog, and update modal
   * are not tested here. Those pieces are mocked so this test can stay focused
   * on whether the MoodHistoryPage itself shows up correctly.
   */
  it("should render the mood history page", async () => {
    renderWithProviders(<MoodHistoryPage />);

    expect(
      screen.getByRole("heading", { name: /mood history/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /filter/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("mood-card")).toBeInTheDocument();
    });

    expect(screen.getByText(/feeling grounded/i)).toBeInTheDocument();
    expect(mockedMoodApi.getAllMoods).toHaveBeenCalledWith(undefined, undefined);
  });
});