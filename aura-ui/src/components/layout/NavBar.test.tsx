import { fireEvent, screen } from "@testing-library/react";
import { useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import NavBar from "./NavBar";
import { renderWithProviders, createAuthenticatedState } from "@/test/testUtilities";

function CurrentPath() {
  const location = useLocation();
  return <output aria-label="Current path">{location.pathname}</output>;
}

describe("NavBar", () => {
  it("shows public destinations when signed out and navigates to registration", () => {
    renderWithProviders(
      <>
        <NavBar />
        <CurrentPath />
      </>
    );

    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create account" })).toBeInTheDocument();
    expect(screen.getByTestId("prism-mark")).toHaveAttribute("aria-hidden", "true");

    fireEvent.click(screen.getByRole("link", { name: "Create account" }));
    expect(screen.getByLabelText("Current path")).toHaveTextContent("/register");
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
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Login" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(screen.getByLabelText("Current path")).toHaveTextContent("/home");
    expect(store.getState().auth.isAuthenticated).toBe(false);
  });
});
