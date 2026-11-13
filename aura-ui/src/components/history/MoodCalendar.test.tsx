import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import dayjs from "dayjs";
import { renderWithProviders } from "@/test/testUtilities";
import MoodCalendar from "./MoodCalendar";

/**
 * The season starts a week ago in local time. Using today's UTC date made every ribbon day "future"
 * (and disabled) whenever local time was behind UTC, e.g. US evenings.
 */
function weekAgoLocal() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

vi.mock("@/store/auraApi", () => ({
  useGetAuraSeasonsQuery: () => ({ data: { current: null, history: [{ key: "tide", name: "Steady Tide", startedOn: weekAgoLocal(), endedOn: null }] } }),
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

/** The grid is a single Tab stop; arrow keys move between days, and today is marked as the current date. */
describe("MoodCalendar keyboard", () => {
  it("roves focus with arrow keys and marks today with aria-current", () => {
    localStorage.setItem("aura.reflections.calendarView", "month");
    renderWithProviders(<MoodCalendar entries={[]} selectedDate={null} onSelectDate={vi.fn()} />);
    const grid = screen.getByRole("table");
    const tabbable = within(grid).getAllByRole("button").filter((button) => button.tabIndex === 0);
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toHaveAttribute("aria-current", "date");
    tabbable[0].focus();
    fireEvent.keyDown(tabbable[0], { key: "ArrowLeft" });
    expect(document.activeElement).not.toBe(tabbable[0]);
    expect(document.activeElement?.getAttribute("data-date")).toBe(new Date(Date.now() - 86400000).toLocaleDateString("en-CA"));
  });
});
