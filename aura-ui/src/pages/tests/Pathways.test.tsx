import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";
import { createAuthenticatedState, renderWithProviders } from "@/test/testUtilities";
import { testReferenceData } from "@/test/referenceDataFixtures";
import Pathways from "../Pathways";

// Same minimal auraApi stub as MoodHistory.test: a store slice plus the one query this page reads.
vi.mock("@/store/auraApi", () => ({
  auraApi: { reducerPath: "auraApi", reducer: (state = {}) => state, middleware: () => (next: (action: unknown) => unknown) => next, util: { invalidateTags: () => ({ type: "noop" }) } },
  useGetZodiacInsightQuery: () => ({ data: undefined, isLoading: false }),
}));
vi.mock("@/store/moodApi", async () => ({
  ...(await vi.importActual<typeof import("@/store/moodApi")>("@/store/moodApi")),
  useGetAllMoodsQuery: () => ({ data: [] }),
}));
vi.mock("@/store/referenceDataApi", async () => ({
  ...(await vi.importActual<typeof import("@/store/referenceDataApi")>("@/store/referenceDataApi")),
  useGetReferenceDataQuery: () => ({ data: testReferenceData, isLoading: false, isError: false }),
}));
vi.mock("@/features/pathways/pathwayActivityApi", async () => ({
  ...(await vi.importActual<typeof import("@/features/pathways/pathwayActivityApi")>("@/features/pathways/pathwayActivityApi")),
  PathwayActivityApi: { getMine: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));
vi.mock("@/features/pathways/astrologyApi", () => ({
  getDailyHoroscope: vi.fn().mockResolvedValue(null),
  getMoonPhaseMoodInsights: vi.fn().mockResolvedValue(null),
}));

/** Signed-in state with one selected pathway and its enabled modules (#385). */
function stateFor(selectedPathway: string, focus: string[]) {
  const state = createAuthenticatedState();
  return { ...state, auth: { ...state.auth, profile: { ...state.auth.profile, selectedPathway, pathwayPreferences: { focus, breathingEnabled: true } } } };
}

/** Renders the hub at a real route so the module key comes from the URL, as in the app router. */
function renderAt(route: string, selectedPathway: string, focus: string[]) {
  return renderWithProviders(
    <Routes>
      <Route path="/pathways" element={<Pathways />} />
      <Route path="/pathways/:moduleKey" element={<Pathways />} />
    </Routes>,
    { route, preloadedState: stateFor(selectedPathway, focus) },
  );
}

describe("Pathways hub (#385)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows only the modules the user enabled for their pathway", () => {
    renderAt("/pathways", "mindfulness", ["practice-log"]);

    expect(screen.getByRole("heading", { name: "Practice log" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "A practical guide to mindfulness" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sacred texts" })).not.toBeInTheDocument();
  });

  it("opens a single module from its navigation route", () => {
    renderAt("/pathways/mindfulness-guide", "mindfulness", ["mindfulness-guide", "practice-log"]);

    expect(screen.getByRole("heading", { name: "A practical guide to mindfulness" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Practice log" })).not.toBeInTheDocument();
  });
});
