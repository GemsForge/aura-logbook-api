import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import dayjs from "dayjs";
import type { TextareaHTMLAttributes } from "react";
import { renderWithProviders } from "@/test/testUtilities";
import { testReferenceData } from "@/test/referenceDataFixtures";
import MoodEntryFormFields from "./MoodEntryFormFields";

vi.mock("@/store/referenceDataApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/store/referenceDataApi")>();
  return { ...actual, useGetReferenceDataQuery: () => ({ data: testReferenceData, isError: false }) };
});

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
    expect(screen.getByRole("group", { name: "Choose one or more moods" })).toBeInTheDocument();
    // Scoped to the mood group: the optional impact-topic checkboxes (#384) live in their own group.
    expect(within(screen.getByRole("group", { name: "Choose one or more moods" })).getAllByRole("checkbox")).toHaveLength(testReferenceData.moods.length);
    expect(Array.from(screen.getByRole("group", { name: "Choose one or more moods" }).querySelectorAll("label"))
      .map((label) => label.textContent?.trim()))
      .toEqual(testReferenceData.moods.map(({ displayName }) => displayName).sort((left, right) => left.localeCompare(right)));
    const empoweredChoice = screen.getByRole("checkbox", { name: /empowered/i });
    const empoweredImage = document.querySelector('img[src="/mood-icons/empowered.png"]');
    expect(screen.getByText("Empowered")).toBeVisible();
    expect(empoweredImage).toHaveAttribute("alt", "");
    expect(empoweredImage).toHaveStyle({ width: "28px", height: "28px" });
    expect(empoweredImage?.parentElement).toHaveAttribute("data-mood-color", "#4caf50");
    expect(screen.queryByLabelText("Date")).not.toBeInTheDocument();
    await user.click(empoweredChoice);
    expect(empoweredChoice).toBeChecked();
    await user.type(screen.getByRole("textbox", { name: "Reflection" }), "  A good day  ");
    await user.click(screen.getByRole("button", { name: "Submit Entry" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      date: dayjs().format("YYYY-MM-DD"),
      moods: ["Empowered"],
      impactTopics: [],
      comment: "A good day",
    }, []);
  });

  it("submits optional impact topics and restores saved ones when editing (#384)", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(<MoodEntryFormFields onSubmit={onSubmit} />);

    const topics = screen.getByRole("group", { name: "Impact topics" });
    expect(screen.getByText(/biggest impact on you\? \(optional\)/)).toBeInTheDocument();
    expect(topics.querySelectorAll('input[type="checkbox"]')).toHaveLength(18);
    await user.click(screen.getByRole("checkbox", { name: /empowered/i }));
    await user.click(screen.getByRole("checkbox", { name: "Work" }));
    await user.click(screen.getByRole("checkbox", { name: "Family" }));
    await user.click(screen.getByRole("checkbox", { name: "Work" }));
    await user.click(screen.getByRole("button", { name: "Submit Entry" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].impactTopics).toEqual(["Family"]);
  });

  it("checks topics saved on an entry being edited", () => {
    renderWithProviders(<MoodEntryFormFields
      entry={{ id: 7, userId: 1, date: "2026-11-10", moods: ["Centered"], impactTopics: ["Money"], createdAt: "2026-11-10T10:00:00Z" }}
      onSubmit={vi.fn()}
    />);

    expect(screen.getByRole("checkbox", { name: "Money" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Work" })).not.toBeChecked();
  });

  it("offers another prompt from the active pathway", async () => {
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
            selectedPathway: "Energy",
          },
        },
      },
    });
    expect(screen.getByText("Prompt")).toBeInTheDocument();
    const prompt = screen.getByTestId("reflection-prompt");
    const initialPrompt = prompt.textContent;

    await user.click(screen.getByRole("button", { name: /another prompt/i }));

    expect(screen.getByTestId("reflection-prompt").textContent).not.toBe(initialPrompt);
  });

  it("preselects saved moods when editing an entry", () => {
    renderWithProviders(<MoodEntryFormFields
      entry={{ id: 7, userId: 1, date: "2026-11-10", moods: ["Centered"], comment: "A note", createdAt: "2026-11-10T10:00:00Z" }}
      onSubmit={vi.fn()}
    />);

    expect(screen.getByRole("checkbox", { name: /centered/i })).toBeChecked();
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    expect(screen.getByText("Date", { selector: "label" })).toBeInTheDocument();
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
