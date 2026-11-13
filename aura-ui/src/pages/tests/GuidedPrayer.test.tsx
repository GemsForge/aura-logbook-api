import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createAuthenticatedState, renderWithProviders } from "@/test/testUtilities";
import GuidedPrayer from "../GuidedPrayer";

/** Confirms the protected prayer page remains optional and uses neutral, user-led wording. */
describe("GuidedPrayer", () => {
  it("offers a neutral alternative and identifies prayer as optional", () => {
    renderWithProviders(<GuidedPrayer />, { preloadedState: createAuthenticatedState() });
    expect(screen.getByRole("heading", { name: "A guided moment" })).toBeInTheDocument();
    expect(screen.getByText(/Prayer is optional/)).toBeInTheDocument();
    expect(screen.getByText(/Neutral reflection/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Pathways" })).toHaveAttribute("href", "/pathways");
  });
});
