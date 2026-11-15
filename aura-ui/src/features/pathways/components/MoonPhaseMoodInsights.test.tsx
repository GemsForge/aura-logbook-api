import type { ReactNode } from "react";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMoonPhaseMoodInsights, type MoonPhaseMoodInsights as MoonInsights } from "../astrologyApi";
import { MoonPhaseMoodInsights } from "./MoonPhaseMoodInsights";

vi.mock("../astrologyApi", () => ({ getMoonPhaseMoodInsights: vi.fn() }));
vi.mock("./InsightFeedback", () => ({ InsightFeedback: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("./PathwayReflectionPrompt", () => ({ PathwayReflectionPrompt: () => <div>Optional reflection</div> }));

const summary: MoonInsights = {
  startDate: "2026-10-15", endDate: "2026-11-13", moodEntryCount: 9, entriesWithPhaseData: 7, datesWithoutPhaseData: 2,
  phases: [
    { phase: "Waxing Crescent", entryCount: 3, moodCounts: { calm: 3, hopeful: 2, tired: 1, joyful: 1, curious: 1 } },
    { phase: "Full Moon", entryCount: 4, moodCounts: { content: 4 } },
  ],
};

describe("moon phase mood exploration", () => {
  beforeEach(() => { vi.mocked(getMoonPhaseMoodInsights).mockReset(); });

  it("shows API counts with phase illustrations and supports keyboard selection", async () => {
    vi.mocked(getMoonPhaseMoodInsights).mockResolvedValue(summary);
    const user = userEvent.setup();
    render(<MoonPhaseMoodInsights />);
    const first = await screen.findByRole("button", { name: /Waxing Crescent.*3 entries/ });
    expect(first).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { level: 2, name: "Moods across moon phases" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Waxing Crescent phase illustration" })).toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "Mood counts during Waxing Crescent" })).getByText("Curious")).toBeInTheDocument();
    const full = screen.getByRole("button", { name: /Full Moon.*4 entries/ });
    act(() => full.focus());
    await user.keyboard("[Enter]");
    expect(full).toHaveAttribute("aria-pressed", "true");
    expect(first).toHaveAttribute("aria-pressed", "false");
    const selectedCounts = screen.getByRole("list", { name: "Mood counts during Full Moon" });
    expect(within(selectedCounts).getByText("Content")).toBeInTheDocument();
    expect(within(selectedCounts).getByText("4")).toBeInTheDocument();
    expect(within(selectedCounts).queryByText("Calm")).not.toBeInTheDocument();
    expect(screen.getByText(/7 of 9 entries have phase data/)).toBeInTheDocument();
    expect(screen.getByText(/unavailable for 2 dates/)).toBeInTheDocument();
    expect(screen.getByText("Optional reflection")).toBeInTheDocument();
  });

  it("retains an unknown provider label without assigning a moon illustration", async () => {
    vi.mocked(getMoonPhaseMoodInsights).mockResolvedValue({ ...summary, phases: [{ phase: "Unspecified phase", entryCount: 7, moodCounts: {} }] });
    render(<MoonPhaseMoodInsights />);
    expect(await screen.findByRole("button", { name: /Unspecified phase.*7 entries/ })).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText(/No individual mood counts were returned/)).toBeInTheDocument();
  });

  it("distinguishes loading and service failure from an empty journal", async () => {
    let rejectRequest!: (reason: Error) => void;
    vi.mocked(getMoonPhaseMoodInsights).mockImplementation(() => new Promise((_resolve, reject) => { rejectRequest = reject; }));
    render(<MoonPhaseMoodInsights />);
    expect(screen.getByText("Loading phase counts…")).toBeInTheDocument();
    await act(async () => rejectRequest(new Error("unavailable")));
    expect(await screen.findByText("Moon phase counts are unavailable right now.")).toBeInTheDocument();
    expect(screen.queryByText("Log a mood to begin noticing patterns.")).not.toBeInTheDocument();
  });

  it("invites a first entry when the API returns no recorded moods", async () => {
    vi.mocked(getMoonPhaseMoodInsights).mockResolvedValue({ ...summary, moodEntryCount: 0, entriesWithPhaseData: 0, phases: [] });
    render(<MoonPhaseMoodInsights />);
    expect(await screen.findByText("Log a mood to begin noticing patterns.")).toBeInTheDocument();
  });

  it("reports missing coverage when moods exist but no phase data was returned", async () => {
    vi.mocked(getMoonPhaseMoodInsights).mockResolvedValue({ ...summary, entriesWithPhaseData: 0, phases: [] });
    render(<MoonPhaseMoodInsights />);
    expect(await screen.findByText("No phase counts are available for this period.")).toBeInTheDocument();
    expect(screen.getByText(/0 of 9 entries have phase data/)).toBeInTheDocument();
    expect(screen.getByText(/unavailable for 2 dates/)).toBeInTheDocument();
  });
});
