import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createAuthenticatedState, renderWithProviders } from "../../test/testUtilities";
import Insights from "../Insights";

const pathway = vi.hoisted(() => ({ selectedPathway: "Mindfulness" }));

vi.mock("../../store/hooks", async () => {
  const actual = await vi.importActual<typeof import("../../store/hooks")>("../../store/hooks");
  return { ...actual, useAppSelector: () => ({ selectedPathway: pathway.selectedPathway }) };
});
vi.mock("../../store/moodApi", () => ({
  useGetAllMoodsQuery: () => ({ isLoading: false, data: [] }),
  useGetMoodBreakdownQuery: () => ({ isLoading: false, data: [{ mood: "Calm", count: 5, percent: 42 }] }),
}));
vi.mock("../../store/auraApi", () => ({
  useGetZodiacInsightQuery: (_arg: unknown, options?: { skip?: boolean }) => options?.skip
    ? { isLoading: false }
    : { isLoading: false, data: { sign: "Virgo", element: "Earth", description: "Grounded.", insights: [{ message: "Trust your rhythm." }] } },
}));
vi.mock("../../components/dashboard/MoodPieChart", () => ({ default: () => <div data-testid="mood-pie-chart" /> }));

/** The Insights page owns the pattern summary and breakdown that used to sit at the bottom of Today. */
describe("Insights", () => {
  it("shows patterns and the mood breakdown without celestial content on the mindful pathway", () => {
    pathway.selectedPathway = "Mindfulness";
    renderWithProviders(<Insights />, { preloadedState: createAuthenticatedState() });
    expect(screen.getByRole("heading", { level: 1, name: "Insights" })).toBeInTheDocument();
    expect(screen.getByText(/patterns will appear here/i)).toBeInTheDocument();
    expect(screen.getByTestId("mood-pie-chart")).toBeInTheDocument();
    expect(screen.queryByText(/virgo/i)).not.toBeInTheDocument();
  });

  it("adds the celestial lens on the Astrology & Energy pathway", () => {
    pathway.selectedPathway = "Energy";
    renderWithProviders(<Insights />, { preloadedState: createAuthenticatedState() });
    expect(screen.getByRole("heading", { name: /virgo • earth/i })).toBeInTheDocument();
  });
});
