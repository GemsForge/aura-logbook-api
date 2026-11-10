import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { TextareaHTMLAttributes } from "react";
import { renderWithProviders } from "@/test/testUtilities";
import MoodEntryFormFields from "./MoodEntryFormFields";

const moodQueryState = vi.hoisted(() => ({ fetchingReplacement: false }));

// Keep the form test focused on field wiring; the editor package's CSS is covered by the browser build.
vi.mock("@uiw/react-md-editor", () => ({
  default: ({ value, onChange, textareaProps }: { value: string; onChange: (value: string) => void; textareaProps?: TextareaHTMLAttributes<HTMLTextAreaElement> }) => (
    <textarea value={value} onChange={(event) => onChange(event.target.value)} {...textareaProps} />
  ),
}));

vi.mock("@/store/auraApi", () => ({
  useGetMoodCombinationInterpretationQuery: ({ moods }: { moods: string[] }) => ({
    data: moodQueryState.fetchingReplacement
      ? { combinationId: "centered-empowered", moods: ["Empowered", "Centered"], pathwayKey: 0, interpretation: "Both feelings can share this moment." }
      : moods.length >= 2 && moods.length <= 3
        ? { combinationId: "centered-empowered", moods, pathwayKey: 0, interpretation: "Both feelings can share this moment." }
        : undefined,
    currentData: !moodQueryState.fetchingReplacement && moods.length >= 2 && moods.length <= 3
      ? { combinationId: "centered-empowered", moods, pathwayKey: 0, interpretation: "Both feelings can share this moment." }
      : undefined,
    isError: false,
    isLoading: false,
    isFetching: moodQueryState.fetchingReplacement,
    isSuccess: moods.length >= 2 && moods.length <= 3,
    refetch: vi.fn(),
  }),
}));

describe("MoodEntryFormFields", () => {
  it("selects a mood and submits the normalized date and trimmed comment", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithProviders(<MoodEntryFormFields onSubmit={onSubmit} />);

    expect(document.getElementById("mood-form")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: /empowered/i }));
    // The note is optional and closed until asked for.
    await user.click(screen.getByRole("button", { name: "Add a note" }));
    await user.type(screen.getByRole("textbox"), "  A good day  ");
    await user.click(screen.getByRole("button", { name: "Submit Entry" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      moods: ["Empowered"],
      comment: "A good day",
    }, []);
  });

  it("renders a pathway interpretation when two authored moods are selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MoodEntryFormFields onSubmit={vi.fn()} />, {
      preloadedState: {
        auth: {
          token: "test-token",
          isAuthenticated: true,
          profile: {
            id: 1,
            email: "gem@example.com",
            displayName: "Gem",
            birthday: "2000-01-01",
            zodiacSign: "capricorn",
            selectedPathway: "Mindfulness",
          },
        },
      },
    });

    await user.click(screen.getByRole("checkbox", { name: /empowered/i }));
    expect(screen.queryByText("Both feelings can share this moment.")).not.toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: /centered/i }));

    expect(await screen.findByText("Both feelings can share this moment.")).toBeInTheDocument();
  });

  it("does not show the previous interpretation while the selected mood set is loading", async () => {
    const user = userEvent.setup();
    moodQueryState.fetchingReplacement = false;
    renderWithProviders(<MoodEntryFormFields onSubmit={vi.fn()} />, {
      preloadedState: {
        auth: {
          token: "test-token",
          isAuthenticated: true,
          profile: {
            id: 1,
            email: "gem@example.com",
            displayName: "Gem",
            birthday: "2000-01-01",
            zodiacSign: "capricorn",
            selectedPathway: "Mindfulness",
          },
        },
      },
    });

    await user.click(screen.getByRole("checkbox", { name: /empowered/i }));
    await user.click(screen.getByRole("checkbox", { name: /centered/i }));
    expect(await screen.findByText("Both feelings can share this moment.")).toBeInTheDocument();

    moodQueryState.fetchingReplacement = true;
    await user.click(screen.getByRole("checkbox", { name: /tense/i }));

    expect(screen.getByRole("status")).toHaveTextContent("Finding a reflection for this mood mix");
    expect(screen.queryByText("Both feelings can share this moment.")).not.toBeInTheDocument();
    moodQueryState.fetchingReplacement = false;
  });

  it("shows validation when no mood is selected", async () => {
    const user = userEvent.setup();

    renderWithProviders(<MoodEntryFormFields onSubmit={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Submit Entry" }));

    expect(await screen.findByText("Select at least one mood")).toBeInTheDocument();
  });
});
