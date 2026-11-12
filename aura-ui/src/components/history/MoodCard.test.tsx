import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import dayjs from "dayjs";
import type { MoodEntry } from "@/features/mood/models/schema";
import { renderWithProviders } from "../../test/testUtilities";
import { MoodCard } from "./MoodCard";

const entry: MoodEntry = {
  id: 7,
  userId: 3,
  date: "2026-10-15",
  moods: ["Harmonious", "Centered"],
  comment: "Feeling grounded.",
  createdAt: "2026-10-15T12:00:00Z",
};

describe("MoodCard", () => {
  it("renders the logged time, moods, and optional comment (the day heading carries the date)", () => {
    renderWithProviders(
      <MoodCard entry={entry} onEdit={vi.fn()} onDelete={vi.fn()} />
    );

    expect(screen.getByText(dayjs(entry.createdAt).format("h:mm A"))).toBeInTheDocument();
    const moods = within(screen.getByRole("group", { name: "Moods for this entry" })).getAllByText(/^(Centered|Harmonious)$/);
    expect(moods.map((mood) => mood.textContent)).toEqual(["Centered", "Harmonious"]);
    expect(screen.getByText("Feeling grounded.")).toBeInTheDocument();
  });

  it("sends the entry to the edit and delete callbacks", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    renderWithProviders(
      <MoodCard entry={entry} onEdit={onEdit} onDelete={onDelete} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit mood entry" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete mood entry" }));

    expect(onEdit).toHaveBeenCalledWith(entry);
    expect(onDelete).toHaveBeenCalledWith(entry);
  });
});

describe("MoodCard moment strip", () => {
  it("lists captured song and weather as one keyboard stop that arrow keys move through", () => {
    renderWithProviders(
      <MoodCard
        entry={{ ...entry, musicTrack: JSON.stringify({ name: "Holocene", artists: "Bon Iver" }), weatherSnapshot: JSON.stringify({ description: "clear sky", iconCode: "01d", temperature: 51, unit: "F" }) }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.tabIndex)).toEqual([0, -1]);
    items[0].focus();
    fireEvent.keyDown(items[0], { key: "ArrowRight" });
    expect(items[1]).toHaveFocus();
    expect(items[1]).toHaveAccessibleName("Weather: 51°F clear sky");
  });
});
