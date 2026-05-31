

import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/testUtilities";
import RegisterForm from "../Register";

vi.mock("../../hooks/useToast", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../hooks/useToast")>();

  return {
    ...actual,
    useToast: () => ({
      showToast: vi.fn(),
    }),
  };
});

vi.mock("@/components/MyPathwaySelector", () => ({
  MyPathwaySelector: () => (
    <div data-testid="pathway-selector">Spiritual Pathway</div>
  ),
}));

vi.mock("@mui/x-date-pickers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mui/x-date-pickers")>();

  return {
    ...actual,
    DatePicker: ({ label }: { label: string }) => (
      <input aria-label={label} readOnly />
    ),
  };
});

describe("RegisterForm", () => {
  it("should render the register form", () => {
    renderWithProviders(<RegisterForm />);

    expect(
      screen.getByRole("heading", { name: /create an account/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByTestId("pathway-selector")).toBeInTheDocument();
    expect(screen.getByLabelText(/birthday/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /register/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /login/i })).toBeInTheDocument();
  });
});