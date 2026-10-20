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
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute(
      "href",
      "#main-content",
    );
    expect(screen.getByRole("contentinfo")).toHaveTextContent("Aura Logbook");
    expect(screen.queryByRole("navigation", { name: "Journal navigation" })).not.toBeInTheDocument();
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
    expect(screen.getByRole("link", { name: "Today" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log mood" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reflections" })).toBeInTheDocument();

    const privateContent = screen.getByRole("heading", { name: "Private content" });
    const profile = screen.getByText("Profile card");
    expect(
      privateContent.compareDocumentPosition(profile) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
