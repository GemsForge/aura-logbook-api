import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { WhyThisColor } from "./WhyThisColor";
import { testReferenceData } from "@/test/referenceDataFixtures";

const contextState = vi.hoisted(() => ({ error: false, retry: vi.fn() }));
vi.mock("@/store/referenceDataApi", () => ({ useGetReferenceDataQuery: () => ({ data: testReferenceData, refetch: contextState.retry }) }));
vi.mock("@/store/moodApi", () => ({ useGetAllMoodsQuery: () => ({ data: [{ id: 1, moods: ["Harmonious"] }], isError: contextState.error, refetch: contextState.retry }) }));

const user = vi.hoisted(() => ({ data: { auraRevealsEnabled: true } as { auraRevealsEnabled?: boolean } | undefined }));
vi.mock("@/store/authApi", () => ({ useGetCurrentUserQuery: () => ({ data: user.data }) }));
vi.mock("@/store/auraApi", () => ({
  useGetCurrentAuraQuery: () => ({ data: { hue: 250, chroma: 0.1, lightness: 0.72, strength: 0.8, intensity: 80, contributors: ["Your Earth sign", "3 check-ins in the last 30 days, mostly Centered"] } }),
}));

describe("WhyThisColor", () => {
  it("lists what shaped the aura", () => {
    user.data = { auraRevealsEnabled: true };
    render(<WhyThisColor />);
    fireEvent.click(screen.getByRole("button", { name: /why this color/i }));
    expect(screen.getByText("Blue")).toBeVisible();
    expect(screen.getByText("Clear expression.")).toBeVisible();
    expect(screen.getByText("In your check-ins: Harmonious")).toBeVisible();
    expect(screen.getByText(/what would you like to make more room for/i)).toBeVisible();
    expect(screen.getByText("Your Earth sign")).toBeInTheDocument();
    expect(screen.getByText(/mostly Centered/)).toBeInTheDocument();
  });

  it("distinguishes unavailable context from having no check-ins and allows a retry", () => {
    user.data = { auraRevealsEnabled: true };
    contextState.error = true;
    render(<WhyThisColor />);
    fireEvent.click(screen.getByRole("button", { name: /why this color/i }));
    expect(screen.getByRole("status")).toHaveTextContent("Color connections aren’t available");
    expect(screen.queryByText(/As you check in/)).not.toBeInTheDocument();
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
