import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { WhyThisColor } from "./WhyThisColor";

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
    expect(screen.getByText("Your Earth sign")).toBeInTheDocument();
    expect(screen.getByText(/mostly Centered/)).toBeInTheDocument();
  });

  it("is hidden when aura reveals are off", () => {
    user.data = { auraRevealsEnabled: false };
    render(<WhyThisColor />);
    expect(screen.queryByRole("button", { name: /why this color/i })).not.toBeInTheDocument();
  });
});
