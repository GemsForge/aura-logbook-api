import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FaithPracticeCheckIn } from "./FaithPracticeCheckIn";

const mocks = vi.hoisted(() => ({ getMine: vi.fn(), create: vi.fn(), update: vi.fn() }));
vi.mock("../pathwayActivityApi", () => ({ localActivityDate: () => "2026-11-13", PathwayActivityApi: mocks }));

describe("FaithPracticeCheckIn explicit recording", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getMine.mockResolvedValue([]);
    mocks.create.mockResolvedValue({ id: 1 });
  });

  it("saves chosen practices separately and leaves daily answers unknown until explicitly saved", async () => {
    render(<FaithPracticeCheckIn />);
    await waitFor(() => expect(mocks.getMine).toHaveBeenCalledTimes(2));
    expect(mocks.create).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("checkbox", { name: "Prayer or supplication" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Gratitude" }));
    expect(mocks.create).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Save practice choices" }));
    await screen.findByRole("heading", { name: "Today’s check-in" });
    expect(mocks.create).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      activityType: "faith-practice-preferences", content: { practiceKeys: ["prayer", "gratitude"] },
    }));
    const prayer = within(screen.getByRole("group", { name: "Prayer or supplication" }));
    const gratitude = within(screen.getByRole("group", { name: "Gratitude" }));
    expect(screen.getByRole("button", { name: "Save today" })).toBeDisabled();
    fireEvent.click(prayer.getByRole("button", { name: "Did" }));
    expect(prayer.getByRole("button", { name: "Did" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(prayer.getByRole("button", { name: "Did" }));
    expect(screen.getByRole("button", { name: "Save today" })).toBeDisabled();
    fireEvent.click(gratitude.getByRole("button", { name: "Didn’t today" }));
    expect(mocks.create).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Save today" }));
    await screen.findByText("Check-in saved.");
    expect(mocks.create).toHaveBeenLastCalledWith(expect.objectContaining({
      activityType: "faith-practice-check-in", content: { practices: { gratitude: false } },
    }));
  });

  it("shows distinct saved-day counts only for practices the user selected", async () => {
    mocks.getMine.mockImplementation(({ activityType }) => Promise.resolve(activityType === "faith-practice-preferences"
      ? [{ id: 9, content: { practiceKeys: ["prayer"] } }]
      : activityType === "faith-practice-check-in" ? [
        { occurredOn: "2026-11-11", content: { practices: { prayer: true, gratitude: true } } },
        { occurredOn: "2026-11-11", content: { practices: { prayer: true } } },
        { occurredOn: "2026-11-12", content: { practices: { prayer: false } } },
      ] : []));
    render(<FaithPracticeCheckIn />);
    // Returning users open on today's check-in; nothing is saved by opening it.
    await screen.findByRole("heading", { name: "Today’s check-in" });
    expect(screen.getByRole("button", { name: "Save today" })).toBeDisabled();
    expect(screen.queryByRole("checkbox", { name: "Gratitude" })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /^Look back/ })[0]);
    const counts = within(await screen.findByRole("complementary", { name: "Faith practice frequency" }));
    expect(counts.getByRole("heading", { name: "Your check-ins" })).toBeInTheDocument();
    expect(counts.getByText("Did 1 days · Didn’t 1 days")).toBeInTheDocument();
    expect(counts.queryByText("Gratitude")).not.toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("button", { name: /^Choose/ })[0]);
    fireEvent.click(screen.getByRole("checkbox", { name: "Gratitude" }));
    fireEvent.click(screen.getAllByRole("button", { name: /^Check in/ })[0]);
    expect(screen.queryByRole("button", { name: "Save today" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Save your updated choices");
  });
  it("keeps failed preference loads distinct from first-time setup and lets the user retry", async () => {
    mocks.getMine.mockRejectedValue(new Error("Offline"));
    render(<FaithPracticeCheckIn />);
    await screen.findByText("Your practice history isn’t available right now.");
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save practice choices" })).not.toBeInTheDocument();
    mocks.getMine.mockResolvedValue([]);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByRole("checkbox", { name: "Prayer or supplication" });
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
