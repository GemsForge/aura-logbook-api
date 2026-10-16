import { renderWithProviders, createAuthenticatedState, createUnauthenticatedState } from "../test/testUtilities";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import ProtectedRoute from "./ProtectedRoute";

function ProtectedRouteTestApp() {
  return (
    <Routes>
      <Route path="/login" element={<h1>Login page</h1>} />
      <Route path="/public" element={<h1>Public page</h1>} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<h1>Dashboard page</h1>} />
        <Route path="/log-mood" element={<h1>Log mood page</h1>} />
        <Route path="/history" element={<h1>Mood history page</h1>} />
      </Route>
    </Routes>
  );
}

describe("ProtectedRoute", () => {
  it.each([
    ["/dashboard", "Dashboard page"],
    ["/log-mood", "Log mood page"],
    ["/history", "Mood history page"],
  ])("redirects unauthenticated users from %s to login", (route) => {
    renderWithProviders(<ProtectedRouteTestApp />, {
      route,
      preloadedState: createUnauthenticatedState(),
    });

    expect(screen.getByRole("heading", { name: "Login page" })).toBeInTheDocument();
  });

  it.each([
    ["/dashboard", "Dashboard page"],
    ["/log-mood", "Log mood page"],
    ["/history", "Mood history page"],
  ])("renders %s for authenticated users", (route, pageHeading) => {
    renderWithProviders(<ProtectedRouteTestApp />, {
      route,
      preloadedState: createAuthenticatedState(),
    });

    expect(screen.getByRole("heading", { name: pageHeading })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Login page" })).not.toBeInTheDocument();
  });

  it("keeps public routes accessible when unauthenticated", () => {
    renderWithProviders(<ProtectedRouteTestApp />, {
      route: "/public",
      preloadedState: createUnauthenticatedState(),
    });

    expect(screen.getByRole("heading", { name: "Public page" })).toBeInTheDocument();
  });
});
