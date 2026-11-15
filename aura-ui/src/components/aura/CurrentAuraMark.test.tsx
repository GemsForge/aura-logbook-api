import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { createAuthenticatedState, renderWithProviders } from "@/test/testUtilities";
import { CurrentAuraMark } from "./CurrentAuraMark";

const current = vi.hoisted(() => ({ hue: 130 as number | null }));
vi.mock("@/store/auraApi", () => ({ useGetCurrentAuraQuery: () => ({ data: { hue: current.hue } }) }));
// The existing explanation dialog has its own data contract; this check protects the shared display boundary.
vi.mock("./WhyThisColor", () => ({ WhyThisColor: () => <button>Why this color?</button> }));

describe("CurrentAuraMark", () => {
  beforeEach(() => { current.hue = 130; });
  it("shows the existing aura and its explanation affordance", () => {
    renderWithProviders(<CurrentAuraMark showExplanation />, { preloadedState: createAuthenticatedState() });
    expect(screen.getByRole("img", { name: "Current aura color" })).toHaveClass("aura-orb");
    expect(screen.getByRole("button", { name: "Why this color?" })).toBeVisible();
  });
  it("keeps the entry cue free of the explanation action", () => {
    renderWithProviders(<CurrentAuraMark />, { preloadedState: createAuthenticatedState() });
    expect(screen.getByRole("img", { name: "Current aura color" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Why this color?" })).not.toBeInTheDocument();
  });
  it("does not present a theme accent as an existing aura when no hue is available", () => {
    current.hue = null;
    renderWithProviders(<CurrentAuraMark />, { preloadedState: createAuthenticatedState() });
    expect(screen.queryByRole("group", { name: "Your current aura" })).not.toBeInTheDocument();
  });
  it("respects the profile's disabled aura reveals even if an old query result is cached", () => {
    const state = createAuthenticatedState();
    renderWithProviders(<CurrentAuraMark />, { preloadedState: { ...state, auth: { ...state.auth, profile: { ...state.auth.profile, auraRevealsEnabled: false } } } });
    expect(screen.queryByRole("group", { name: "Your current aura" })).not.toBeInTheDocument();
  });
});
