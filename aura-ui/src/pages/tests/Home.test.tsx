import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/testUtilities";
import HomePage from "../Home";

/**
 * Mocks the feature card section so this smoke test can focus on the
 * HomePage layout and visible landing page content rather than the
 * implementation details of the nested AuraFeatureCards component.
 */
vi.mock("../../components/home/AuraFeatureCard", () => ({
  default: () => <div data-testid="aura-feature-cards">Aura Feature Cards</div>,
}));

describe("HomePage", () => {
  /**
   * Verifies that the HomePage renders its primary landing page content,
   * including the heading, supporting copy, feature card section, call-to-action,
   * and closing quote.
   */
  it("should render the home page content", () => {
    renderWithProviders(<HomePage />);

    expect(
      screen.getByRole("heading", { name: /welcome to aura logbook/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/your energy tells a story/i)).toBeInTheDocument();
    expect(
      screen.getByText(/aura logbook isn’t just about tracking mood/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId("aura-feature-cards")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /start your aura journey/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/when you track your aura, you tune into your truth/i)
    ).toBeInTheDocument();
  });
});
