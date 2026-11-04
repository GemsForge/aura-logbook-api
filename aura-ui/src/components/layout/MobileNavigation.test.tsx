import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders, createAuthenticatedState } from "@/test/testUtilities";
import MobileNavigation from "./MobileNavigation";

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
});
