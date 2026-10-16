import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import AppLayout from "./AppLayout";
import { renderWithProviders, createAuthenticatedState } from "@/test/testUtilities";

vi.mock("../profile/ProfileCard", () => ({ default: () => <div>Profile card</div> }));
vi.mock("../profile/EditProfileModal", () => ({
  default: () => <div>Edit profile modal</div>,
}));

describe("AppLayout", () => {
  it("renders the public page between the navigation and footer", () => {
    renderWithProviders(
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<h1>Public content</h1>} />
        </Route>
      </Routes>
    );

    expect(screen.getByRole("heading", { name: "Public content" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toHaveTextContent("Aura Logbook");
    expect(screen.queryByRole("link", { name: "Log Mood" })).not.toBeInTheDocument();
  });

  it("renders the profile/sidebar column for authenticated pages", () => {
    renderWithProviders(
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<h1>Private content</h1>} />
        </Route>
      </Routes>,
      { preloadedState: createAuthenticatedState() }
    );

    expect(screen.getByRole("heading", { name: "Private content" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log Mood" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mood History" })).toBeInTheDocument();
  });
});
