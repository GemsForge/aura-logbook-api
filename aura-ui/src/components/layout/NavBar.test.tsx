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

    expect(screen.getByRole("button", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Register" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Dashboard" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Register" }));
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

    expect(screen.getByRole("button", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Login" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));
    expect(screen.getByLabelText("Current path")).toHaveTextContent("/home");
    expect(store.getState().auth.isAuthenticated).toBe(false);
  });
});
