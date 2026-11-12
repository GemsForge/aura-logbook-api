import { fireEvent, screen, within } from "@testing-library/react";
import { useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import NavBar from "./NavBar";
import { renderWithProviders, createAuthenticatedState } from "@/test/testUtilities";

function CurrentPath() {
  const location = useLocation();
  return <output aria-label="Current path">{location.pathname}</output>;
}

describe("NavBar", () => {
  it("shows public account actions without a redundant Home link", () => {
    renderWithProviders(
      <>
        <NavBar />
        <CurrentPath />
      </>
    );

    expect(screen.getByRole("link", { name: "Aura Logbook home" })).toHaveAttribute("href", "/home");
    expect(screen.queryByRole("link", { name: "Home" })).not.toBeInTheDocument();
    // The header no longer carries Login/Create account; the landing page leads with sign-in.
    expect(screen.queryByRole("link", { name: "Login" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Create account" })).not.toBeInTheDocument();
    expect(screen.getByTestId("prism-mark")).toHaveAttribute("aria-hidden", "true");
  });

  it("shows no Login or Create account links to signed-out visitors", () => {
    renderWithProviders(<NavBar />);

    expect(screen.queryByRole("link", { name: "Login" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Create account" })).not.toBeInTheDocument();
  });

  it("shows authenticated destinations and logs out to home", () => {
    const { store } = renderWithProviders(
      <>
        <NavBar />
        <CurrentPath />
      </>,
      { preloadedState: createAuthenticatedState() }
    );

    expect(screen.getByRole("link", { name: "Aura Logbook home" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    const mainNavigation = within(screen.getByRole("navigation", { name: "Main navigation" }));
    expect(mainNavigation.getByRole("link", { name: "Today" })).toHaveAttribute("href", "/dashboard");
    expect(mainNavigation.queryByRole("link", { name: "Home" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open profile menu" }));
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Login" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(screen.getByLabelText("Current path")).toHaveTextContent("/home");
    expect(store.getState().auth.isAuthenticated).toBe(false);
  });

  it("keeps Home out of the signed-in mobile menu", () => {
    renderWithProviders(<NavBar />, {
      preloadedState: createAuthenticatedState(),
    });

    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    const mobileNavigation = within(screen.getByRole("navigation", { name: "Mobile navigation" }));
    expect(mobileNavigation.getByRole("link", { name: "Today" })).toHaveAttribute("href", "/dashboard");
    expect(mobileNavigation.queryByRole("link", { name: "Home" })).not.toBeInTheDocument();
  });
});
