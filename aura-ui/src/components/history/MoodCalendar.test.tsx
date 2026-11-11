import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/testUtilities";
import MoodCalendar from "./MoodCalendar";

vi.mock("@/store/auraApi", () => ({
  useGetAuraSeasonsQuery: () => ({ data: { current: null, history: [{ key: "tide", name: "Steady Tide", startedOn: new Date().toISOString().slice(0, 10), endedOn: null }] } }),
}));

describe("MoodCalendar season labels", () => {
  it("includes the season in the accessible name for dates with a season ribbon", () => {
    renderWithProviders(<MoodCalendar entries={[]} selectedDate={null} onSelectDate={vi.fn()} />);
    const seasonDays = screen.getAllByRole("button", { name: /Steady Tide season/ });
    expect(seasonDays.some((button) => !button.hasAttribute("disabled"))).toBe(true);
  });
});
