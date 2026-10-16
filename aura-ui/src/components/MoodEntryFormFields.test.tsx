import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/testUtilities";
import MoodEntryFormFields from "./MoodEntryFormFields";

describe("MoodEntryFormFields", () => {
  it("selects a mood and submits the normalized date and trimmed comment", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithProviders(<MoodEntryFormFields onSubmit={onSubmit} />);

    await user.click(screen.getByRole("checkbox", { name: /empowered/i }));
    await user.type(screen.getByRole("textbox"), "  A good day  ");
    await user.click(screen.getByRole("button", { name: "Submit Entry" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      moods: ["Empowered"],
      comment: "A good day",
    });
  });

  it("shows validation when no mood is selected", async () => {
    const user = userEvent.setup();

    renderWithProviders(<MoodEntryFormFields onSubmit={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Submit Entry" }));

    expect(await screen.findByText("Select at least one mood")).toBeInTheDocument();
  });
});
