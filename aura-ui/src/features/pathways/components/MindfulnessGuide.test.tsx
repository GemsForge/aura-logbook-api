import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/testUtilities";
import { PathwayActivityApi } from "../pathwayActivityApi";
import { MindfulnessGuide } from "./MindfulnessGuide";

vi.mock("../pathwayActivityApi", async () => ({
  ...(await vi.importActual<typeof import("../pathwayActivityApi")>("../pathwayActivityApi")),
  PathwayActivityApi: { getMine: vi.fn(), create: vi.fn() },
}));

describe("MindfulnessGuide", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(PathwayActivityApi.getMine).mockResolvedValue([]);
  });

  it("explores authored concepts and concrete DBT practice steps without recording a practice", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MindfulnessGuide />);

    await user.click(screen.getByRole("button", { name: "Begin again" }));
    expect(screen.getByText("Missed days happen. Return when you’re ready; no streak or catch-up is needed.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Begin again" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "DBT skills" }));
    await user.click(screen.getByRole("button", { name: "Describe" }));
    expect(screen.getByRole("heading", { name: "Describe", level: 3 })).toBeVisible();
    expect(screen.getByText("Put one thing you notice into words: “I hear…” or “I notice…”")).toBeVisible();
    expect(screen.getByRole("link", { name: "Open breathing" })).toHaveAttribute("href", "/pathways/breathing");
    expect(screen.getByRole("link", { name: "Log a practice" })).toHaveAttribute("href", "/pathways/practice-log");
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(PathwayActivityApi.create).not.toHaveBeenCalled();
  });

  it("respects turned-off module destinations", () => {
    renderWithProviders(<MindfulnessGuide breathingEnabled={false} practiceLogEnabled={false} />);
    expect(screen.queryByRole("link", { name: "Open breathing" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Log a practice" })).not.toBeInTheDocument();
  });

  it("keeps the optional reflection unsaved until its explicit journal action", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MindfulnessGuide />);
    await user.type(screen.getByRole("textbox", { name: "Your reflection" }), "A pause before lunch.");
    expect(PathwayActivityApi.create).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Save to journal" }));
    expect(PathwayActivityApi.create).toHaveBeenCalledWith(expect.objectContaining({
      pathway: "mindfulness", moduleKey: "mindfulness-guide", activityType: "pathway-reflection",
      content: expect.objectContaining({ insightType: "mindfulness-concept", responseText: "A pause before lunch." }),
    }));
    expect(await screen.findByText("Saved to your journal.")).toBeVisible();
  });
});
