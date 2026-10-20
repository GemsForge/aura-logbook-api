import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Sidebar from "./Sidebar";
import { renderWithProviders } from "@/test/testUtilities";

describe("Sidebar", () => {
  it("marks only the link for the current page as current", () => {
    renderWithProviders(<Sidebar />, { route: "/history" });

    expect(screen.getByRole("navigation", { name: "Journal navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reflections" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Log mood" })).not.toHaveAttribute("aria-current");
  });
});
