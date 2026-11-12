import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
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

/** Phones get a Week/Month toggle; week shows one row, month the full grid, and the choice is remembered. */
describe("MoodCalendar week/month toggle", () => {
  it("starts on one week row and expands to the month", () => {
    localStorage.removeItem("aura.reflections.calendarView");
    renderWithProviders(<MoodCalendar entries={[]} selectedDate={null} onSelectDate={vi.fn()} />);
    const grid = screen.getByRole("table");
    expect(within(grid).getAllByRole("row")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Week" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Previous week" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Month" }));
    expect(within(screen.getByRole("table")).getAllByRole("row").length).toBeGreaterThan(4);
    expect(screen.getByRole("button", { name: "Previous month" })).toBeInTheDocument();
    expect(localStorage.getItem("aura.reflections.calendarView")).toBe("month");
  });
});
