import dayjs from "dayjs";
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
  useGetAllMoodsQuery: () => ({ isLoading: false, data: [{ id: 1, date: dayjs().format("YYYY-MM-DD"), createdAt: new Date().toISOString(), moods: ["Centered"] }] }),
}));
vi.mock("../../store/referenceDataApi", async () => ({
  ...(await vi.importActual<object>("../../store/referenceDataApi")),
  useGetReferenceDataQuery: () => ({ data: { moods: [{ key: "Centered", icon: "/mood-icons/centered.png", energyLevel: 3, auraColorKeys: ["green"] }], auras: [{ key: "green", shades: { 500: "#4caf50" } }] } }),
}));
vi.mock("../../store/auraApi", () => ({
  useGetZodiacInsightQuery: (_arg: unknown, options?: { skip?: boolean }) => options?.skip
    ? { isLoading: false }
    : { isLoading: false, data: { sign: "Virgo", element: "Earth", description: "Grounded.", insights: [{ message: "Trust your rhythm." }] } },
}));

/** The Insights page owns the pattern summary and breakdown that used to sit at the bottom of Today. */
describe("Insights", () => {
  it("shows top mood and mood mix without celestial content on the mindful pathway", () => {
    pathway.selectedPathway = "Mindfulness";
    renderWithProviders(<Insights />, { preloadedState: createAuthenticatedState() });
    expect(screen.getByRole("heading", { level: 1, name: "Insights" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /top mood this week: centered/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mood mix" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Insights period" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Aura ribbon" })).toBeInTheDocument();
    // One check-in is not a pattern: no "log more" nag and no factor rows.
    expect(screen.queryByRole("heading", { name: "What shapes your energy" })).not.toBeInTheDocument();
    expect(screen.queryByText(/log a few more/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/virgo/i)).not.toBeInTheDocument();
  });

  it("adds the celestial lens on the Astrology & Energy pathway", () => {
    pathway.selectedPathway = "Energy";
    renderWithProviders(<Insights />, { preloadedState: createAuthenticatedState() });
    expect(screen.getByRole("heading", { name: /virgo • earth/i })).toBeInTheDocument();
  });
});
