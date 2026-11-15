import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { WhyThisColor } from "./WhyThisColor";
import { testReferenceData } from "@/test/referenceDataFixtures";

const contextState = vi.hoisted(() => ({ error: false, retry: vi.fn(), entries: [{ id: 1, moods: ["Harmonious"] }] }));
vi.mock("@/store/referenceDataApi", () => ({ useGetReferenceDataQuery: () => ({ data: testReferenceData, refetch: contextState.retry }) }));
vi.mock("@/store/moodApi", () => ({ useGetAllMoodsQuery: () => ({ data: contextState.entries, isError: contextState.error, refetch: contextState.retry }) }));

const user = vi.hoisted(() => ({ data: { auraRevealsEnabled: true } as { auraRevealsEnabled?: boolean } | undefined }));
vi.mock("@/store/authApi", () => ({ useGetCurrentUserQuery: () => ({ data: user.data }) }));
vi.mock("@/store/auraApi", () => ({
  useGetCurrentAuraQuery: () => ({ data: { hue: 250, chroma: 0.1, lightness: 0.72, strength: 0.8, intensity: 80, contributors: ["Your Earth sign", "3 check-ins in the last 30 days, mostly Centered"] } }),
}));

describe("WhyThisColor", () => {
  beforeEach(() => { contextState.error = false; contextState.retry.mockClear(); contextState.entries = [{ id: 1, moods: ["Harmonious"] }]; user.data = { auraRevealsEnabled: true }; });
  it("lists what shaped the aura", () => {
    user.data = { auraRevealsEnabled: true };
    render(<WhyThisColor />);
    fireEvent.click(screen.getByRole("button", { name: /why this color/i }));
    expect(screen.getByText("Blue", { exact: false })).toBeVisible();
    expect(screen.getByText("Clear expression.")).toBeVisible();
    expect(screen.getByText("Recorded: Harmonious")).toBeVisible();
    expect(screen.getByText("· 1 check-in")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Colors in your logs · last 30 days" })).toBeVisible();
    expect(screen.getByText("Your Earth sign")).toBeInTheDocument();
    expect(screen.getByText(/mostly Centered/)).toBeInTheDocument();
  });

  it("counts a color once per entry even when two selected moods share it", () => {
    contextState.entries = [{ id: 1, moods: ["Harmonious", "Weary"] }, { id: 2, moods: ["Harmonious"] }];
    render(<WhyThisColor />);
    fireEvent.click(screen.getByRole("button", { name: /why this color/i }));
    expect(screen.getByText("· 2 check-ins")).toBeVisible();
    expect(screen.getByText("Recorded: Harmonious, Weary")).toBeVisible();
  });

  it("does not call existing check-ins empty when their reference mapping is unavailable", () => {
    contextState.entries = [{ id: 1, moods: ["ArchivedMood"] }];
    render(<WhyThisColor />);
    fireEvent.click(screen.getByRole("button", { name: /why this color/i }));
    expect(screen.getByText("No color associations are available for these check-ins.")).toBeVisible();
    expect(screen.queryByText("No check-ins in this period yet.")).not.toBeInTheDocument();
  });

  it("distinguishes unavailable context from having no check-ins and allows a retry", () => {
    user.data = { auraRevealsEnabled: true };
    contextState.error = true;
    render(<WhyThisColor />);
    fireEvent.click(screen.getByRole("button", { name: /why this color/i }));
    expect(screen.getByRole("status")).toHaveTextContent("Color connections aren’t available");
    expect(screen.queryByText(/No check-ins in this period/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(contextState.retry).toHaveBeenCalledTimes(2);
    contextState.error = false;
  });

  it("is hidden when aura reveals are off", () => {
    user.data = { auraRevealsEnabled: false };
    render(<WhyThisColor />);
    expect(screen.queryByRole("button", { name: /why this color/i })).not.toBeInTheDocument();
  });
});
