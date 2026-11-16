import dayjs from "dayjs";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createAuthenticatedState, renderWithProviders } from "../../test/testUtilities";
import Insights from "../Insights";

const pathway = vi.hoisted(() => ({ selectedPathway: "Mindfulness" }));
const moodEntries = vi.hoisted(() => ({ values: [] as Array<Record<string, unknown>> }));

vi.mock("../../store/hooks", async () => {
  const actual = await vi.importActual<typeof import("../../store/hooks")>("../../store/hooks");
  return { ...actual, useAppSelector: () => ({ selectedPathway: pathway.selectedPathway }) };
});
vi.mock("../../store/moodApi", () => ({
  useGetAllMoodsQuery: () => ({ isLoading: false, data: moodEntries.values }),
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
  it("keeps the energy factors panel visible with an accessible empty state", () => {
    pathway.selectedPathway = "Mindfulness";
    moodEntries.values = [{ id: 1, userId: 1, date: dayjs().format("YYYY-MM-DD"), createdAt: new Date().toISOString(), moods: ["Centered"] }];
    renderWithProviders(<Insights />, { preloadedState: createAuthenticatedState() });
    expect(screen.getByRole("region", { name: "What shapes your energy" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/patterns to show/i);
    expect(screen.getByRole("status")).toHaveTextContent(/a few check-ins both with and without things like music, a photo, clear-sky weather, or late-night timing/i);
  });

  it("renders qualified factors from mood entry context", () => {
    pathway.selectedPathway = "Mindfulness";
    const today = dayjs().format("YYYY-MM-DD");
    moodEntries.values = [
      { id: 1, userId: 1, date: today, createdAt: `${today}T09:00:00Z`, moods: ["Empowered"], occurredAt: `${today}T09:00:00Z`, musicTrack: JSON.stringify({ name: "Song", artists: "Artist" }) },
      { id: 2, userId: 1, date: today, createdAt: `${today}T10:00:00Z`, moods: ["Empowered"], occurredAt: `${today}T10:00:00Z`, musicTrack: JSON.stringify({ name: "Song", artists: "Artist" }) },
      { id: 3, userId: 1, date: today, createdAt: `${today}T11:00:00Z`, moods: ["Centered"], occurredAt: `${today}T11:00:00Z`, musicTrack: null },
      { id: 4, userId: 1, date: today, createdAt: `${today}T12:00:00Z`, moods: ["Centered"], occurredAt: `${today}T12:00:00Z`, musicTrack: null },
    ];
    renderWithProviders(<Insights />, { preloadedState: createAuthenticatedState() });
    expect(screen.getByRole("region", { name: "What shapes your energy" })).toBeInTheDocument();
    expect(screen.getByText("Entries with music")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "What shapes your energy" })).toHaveTextContent("About the same");
    expect(screen.getByText(/Patterns, not causes/)).toBeInTheDocument();
  });

  it("shows average energy and mood mix without celestial content on the mindful pathway", () => {
    pathway.selectedPathway = "Mindfulness";
    moodEntries.values = [{ id: 1, date: dayjs().format("YYYY-MM-DD"), createdAt: new Date().toISOString(), moods: ["Centered"] }];
    renderWithProviders(<Insights />, { preloadedState: createAuthenticatedState() });
    expect(screen.getByRole("heading", { level: 1, name: "Insights" })).toBeInTheDocument();
    // Average energy replaces top mood on Insights; one Centered (energy 3) check-in averages 3.0.
    expect(screen.getByText("Average energy")).toBeInTheDocument();
    expect(screen.getByText("3.0")).toBeInTheDocument();
    expect(screen.queryByText("Top mood")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mood mix" })).toBeInTheDocument();
    expect(screen.getByText("1 mood")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Insights period" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Aura ribbon" })).toBeInTheDocument();
    // One check-in is not a pattern: the accessible empty state replaces factor rows without a "log more" nag.
    expect(screen.getByRole("heading", { name: "What shapes your energy" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/patterns to show/i);
    expect(screen.queryByText(/log a few more/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/virgo/i)).not.toBeInTheDocument();
  });

  it("pluralizes the mood mix count for multiple moods", () => {
    pathway.selectedPathway = "Mindfulness";
    const today = dayjs().format("YYYY-MM-DD");
    moodEntries.values = [
      { id: 1, date: today, createdAt: `${today}T09:00:00Z`, moods: ["Centered"] },
      { id: 2, date: today, createdAt: `${today}T10:00:00Z`, moods: ["Centered"] },
    ];
    renderWithProviders(<Insights />, { preloadedState: createAuthenticatedState() });
    expect(screen.getByText("2 moods")).toBeInTheDocument();
  });

  it("adds the celestial lens on the Astrology & Energy pathway", () => {
    pathway.selectedPathway = "Energy";
    moodEntries.values = [{ id: 1, date: dayjs().format("YYYY-MM-DD"), createdAt: new Date().toISOString(), moods: ["Centered"] }];
    renderWithProviders(<Insights />, { preloadedState: createAuthenticatedState() });
    expect(screen.getByRole("heading", { name: /virgo • earth/i })).toBeInTheDocument();
  });
});
