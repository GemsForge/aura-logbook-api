import { screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/testUtilities";
import { testReferenceData } from "../../test/referenceDataFixtures";
import ReflectionRead from "../ReflectionRead";

vi.mock("@/store/referenceDataApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/store/referenceDataApi")>();
  return { ...actual, useGetReferenceDataQuery: () => ({ data: testReferenceData, isError: false }) };
});

vi.mock("@/api/MoodApi", () => ({
  MoodApi: {
    getAllMoods: vi.fn().mockResolvedValue([
      { id: 1, userId: 1, date: "2026-10-08", moods: ["Centered"], comment: "Earlier day.", createdAt: "2026-10-08T13:00:00Z" },
      { id: 2, userId: 1, date: "2026-10-09", moods: ["Weary"], comment: "Rest can be the thing I choose next.", createdAt: "2026-10-09T13:05:00Z",
        weatherSnapshot: JSON.stringify({ description: "overcast", iconCode: "04d", temperature: 58, unit: "F" }) },
    ]),
    deleteMood: vi.fn(),
  },
}));

// The edit modal pulls in the markdown editor's CSS, which the test runner cannot load.
vi.mock("@/components/MoodUpdateModal", () => ({ default: () => null }));
vi.mock("@/components/DeleteConfirmDialog", () => ({ default: () => null }));

/** The reading view shows one reflection in full and steps through entries in time order. */
describe("ReflectionRead", () => {
  it("renders the full reflection with its date heading, weather, and Earlier/Later navigation", async () => {
    renderWithProviders(<Routes><Route path="/history/:id" element={<ReflectionRead />} /></Routes>, { route: "/history/2" });

    expect(await screen.findByRole("heading", { level: 1, name: "Friday, October 9" })).toBeInTheDocument();
    expect(screen.getByText("Rest can be the thing I choose next.")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Moods" })).toHaveTextContent("Weary");
    expect(screen.getByText("58°F")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Earlier reflection, October 8" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "No later reflection" })).toBeDisabled();
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toHaveFocus());
  });
});
