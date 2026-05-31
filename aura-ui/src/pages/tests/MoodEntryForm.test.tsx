import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/testUtilities";
import MoodEntryForm from "@/components/MoodEntryForm";

vi.mock("../../hooks/useToast", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../hooks/useToast")>();

  return {
    ...actual,
    useToast: () => ({
      showToast: vi.fn(),
    }),
  };
});

vi.mock("@/components/MoodEntryFormFields", () => ({
  default: () => (
    <div data-testid="mood-entry-form-fields">Mood Entry Form Fields</div>
  ),
}));

describe("MoodEntryForm", () => {
  /**
   * Verifies that the MoodEntryForm renders the page heading and delegates
   * the actual form controls to the MoodEntryFormFields child component.
   */
  it("should render the mood entry form", () => {
    renderWithProviders(<MoodEntryForm />);

    expect(
      screen.getByRole("heading", { name: /log your mood/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId("mood-entry-form-fields")).toBeInTheDocument();
  });
});
