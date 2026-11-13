import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/testUtilities";
import { PathwayActivityApi, type PathwayActivity } from "../pathwayActivityApi";
import { MindfulPracticeLog } from "./MindfulPracticeLog";

vi.mock("../pathwayActivityApi", async () => ({
  ...(await vi.importActual<typeof import("../pathwayActivityApi")>("../pathwayActivityApi")),
  PathwayActivityApi: { getMine: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));

/** A synthetic saved practice verifies note rendering and edits without personal journal data. */
const savedPractice: PathwayActivity = {
  id: 17, userId: 1, pathway: "mindfulness", moduleKey: "practice-log", activityType: "mindful-practice",
  occurredOn: "2026-11-01", createdAt: "2026-11-01T12:00:00Z", updatedAt: "2026-11-01T12:00:00Z",
  content: { practice: "Observe", durationMinutes: 3, note: "Listened to the rain." },
};

describe("MindfulPracticeLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(PathwayActivityApi.getMine).mockResolvedValue([]);
    vi.mocked(PathwayActivityApi.create).mockResolvedValue(savedPractice);
    vi.mocked(PathwayActivityApi.update).mockResolvedValue(undefined);
    vi.mocked(PathwayActivityApi.remove).mockResolvedValue(undefined);
  });

  it("saves only explicitly, omits optional empty content, and renders the returned history", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MindfulPracticeLog />);
    expect(await screen.findByText(/No practices logged yet/)).toBeVisible();
    expect(PathwayActivityApi.create).not.toHaveBeenCalled();
    vi.mocked(PathwayActivityApi.getMine).mockResolvedValue([savedPractice]);
    await user.click(screen.getByRole("button", { name: "Save practice" }));
    expect(PathwayActivityApi.create).toHaveBeenCalledWith(expect.objectContaining({
      pathway: "mindfulness", moduleKey: "practice-log", activityType: "mindful-practice",
      content: { practice: "Breath awareness" },
    }));
    const history = await screen.findByRole("list", { name: "Saved practices" });
    expect(within(history).getByText("Listened to the rain.")).toBeVisible();
    expect(screen.getByText("Practice saved.")).toBeVisible();
  });

  it("retains the draft on a save failure and prevents an invalid duration", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MindfulPracticeLog />);
    await user.type(screen.getByRole("textbox", { name: "Note (optional)" }), "A quiet moment.");
    await user.type(screen.getByRole("spinbutton", { name: "Minutes (optional)" }), "0");
    expect(screen.getByRole("button", { name: "Save practice" })).toBeDisabled();
    expect(screen.getByText("Use 1–1440 whole minutes.")).toBeVisible();
    await user.clear(screen.getByRole("spinbutton", { name: "Minutes (optional)" }));
    vi.mocked(PathwayActivityApi.create).mockRejectedValue(new Error("offline"));
    await user.click(screen.getByRole("button", { name: "Save practice" }));
    expect(await screen.findByText("Couldn’t save your practice. Check the details and try again.")).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Note (optional)" })).toHaveValue("A quiet moment.");
  });

  it("edits an existing note while preserving its original calendar day", async () => {
    const user = userEvent.setup();
    vi.mocked(PathwayActivityApi.getMine).mockResolvedValue([savedPractice]);
    renderWithProviders(<MindfulPracticeLog />);
    await user.click(await screen.findByRole("button", { name: "Edit Observe on 2026-11-01" }));
    expect(screen.getByRole("textbox", { name: "Note (optional)" })).toHaveValue("Listened to the rain.");
    await user.clear(screen.getByRole("textbox", { name: "Note (optional)" }));
    await user.type(screen.getByRole("textbox", { name: "Note (optional)" }), "Noticed the wind.");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(PathwayActivityApi.update).toHaveBeenCalledWith(17, expect.objectContaining({
      occurredOn: "2026-11-01", content: { practice: "Observe", durationMinutes: 3, note: "Noticed the wind." },
    })));
    expect(PathwayActivityApi.create).not.toHaveBeenCalled();
    expect(await screen.findByText("Practice updated.")).toBeVisible();
  });

  it("deletes only the selected saved practice and refreshes history", async () => {
    const user = userEvent.setup();
    vi.mocked(PathwayActivityApi.getMine).mockResolvedValueOnce([savedPractice]).mockResolvedValue([]);
    renderWithProviders(<MindfulPracticeLog />);
    await user.click(await screen.findByRole("button", { name: "Delete Observe on 2026-11-01" }));
    expect(PathwayActivityApi.remove).toHaveBeenCalledWith(17);
    expect(await screen.findByText(/No practices logged yet/)).toBeVisible();
    expect(screen.queryByText("Listened to the rain.")).not.toBeInTheDocument();
  });

  it("distinguishes history failures from an empty journal and supports retry", async () => {
    const user = userEvent.setup();
    vi.mocked(PathwayActivityApi.getMine).mockRejectedValueOnce(new Error("offline")).mockResolvedValue([savedPractice]);
    renderWithProviders(<MindfulPracticeLog />);
    expect(await screen.findByText("Your practice log isn’t available right now.")).toBeVisible();
    expect(screen.queryByText(/No practices logged yet/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Listened to the rain.")).toBeVisible();
    expect(screen.queryByText("Your practice log isn’t available right now.")).not.toBeInTheDocument();
  });
});
