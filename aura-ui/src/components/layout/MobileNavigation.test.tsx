import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders, createAuthenticatedState } from "@/test/testUtilities";
import MobileNavigation, { MobilePathwayNavigation } from "./MobileNavigation";

/** Verifies route selection and access to the shared profile editor from the mobile dock. */
describe("MobileNavigation", () => {
  it("marks the current destination and opens the profile editor", async () => {
    renderWithProviders(<MobileNavigation />, {
      route: "/history", preloadedState: createAuthenticatedState(),
    });
    expect(screen.getByRole("link", { name: "Reflections" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Today" })).not.toHaveAttribute("aria-current");
    const profile = screen.getByRole("button", { name: "Profile" });
    await userEvent.click(profile);
    expect(profile).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Reflections" })).not.toHaveAttribute("aria-current");
  });

  it("keeps enabled pathway destinations in flow and identifies the current module", () => {
    const state = createAuthenticatedState();
    renderWithProviders(<MobilePathwayNavigation />, {
      route: "/pathways/daily-astrology", preloadedState: {
        ...state, auth: { ...state.auth, profile: { ...state.auth.profile, selectedPathway: "energy", pathwayPreferences: { focus: ["daily-astrology"], breathingEnabled: false } } },
      },
    });
    const current = screen.getByRole("link", { name: "Astrology & Energy" });
    expect(current).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Breathing" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Chakra reference" })).not.toBeInTheDocument();
    expect(getComputedStyle(current.closest("nav")!).position).toBe("relative");
  });
});
