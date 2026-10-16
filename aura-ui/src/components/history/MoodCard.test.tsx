import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
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
  it("renders the date, moods, and optional comment", () => {
    renderWithProviders(
      <MoodCard entry={entry} onEdit={vi.fn()} onDelete={vi.fn()} />
    );

    expect(screen.getByText(dayjs(entry.date).format("LL"))).toBeInTheDocument();
    expect(screen.getByText(/Harmonious/)).toBeInTheDocument();
    expect(screen.getByText(/Centered/)).toBeInTheDocument();
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
