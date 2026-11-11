import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/testUtilities";
import { AuthApi } from "../../api/AuthApi";
import ForgotPassword, { FORGOT_PASSWORD_CONFIRMATION } from "../ForgotPassword";
import ResetPassword, { INVALID_RESET_LINK } from "../ResetPassword";

/** #329: request form, reset page, and invalid/expired token states. */
vi.mock("../../api/AuthApi", () => ({
  AuthApi: { forgotPassword: vi.fn(), resetPassword: vi.fn() },
}));

const type = (label: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("ForgotPassword", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the generic confirmation after a request", async () => {
    vi.mocked(AuthApi.forgotPassword).mockResolvedValue({ message: "ok" });
    renderWithProviders(<ForgotPassword />);

    type(/email/i, "someone@example.test");
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(await screen.findByText(FORGOT_PASSWORD_CONFIRMATION)).toBeInTheDocument();
    expect(AuthApi.forgotPassword).toHaveBeenCalledWith("someone@example.test");
  });

  it("validates the email before calling the API", async () => {
    renderWithProviders(<ForgotPassword />);
    type(/email/i, "not-an-email");
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
    expect(AuthApi.forgotPassword).not.toHaveBeenCalled();
  });

  it("explains rate limiting", async () => {
    vi.mocked(AuthApi.forgotPassword).mockRejectedValue({ response: { status: 429 } });
    renderWithProviders(<ForgotPassword />);
    type(/email/i, "someone@example.test");
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/too many requests/i);
  });
});

describe("ResetPassword", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the invalid-link state when no token is present", () => {
    renderWithProviders(<ResetPassword />, { route: "/reset-password" });
    expect(screen.getByRole("alert")).toHaveTextContent(INVALID_RESET_LINK);
    expect(screen.queryByLabelText(/^new password/i)).not.toBeInTheDocument();
  });

  it("enforces 8–72 characters and matching confirmation", async () => {
    renderWithProviders(<ResetPassword />, { route: "/reset-password?token=abc" });
    type(/^new password/i, "short");
    type(/confirm new password/i, "different");
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }));

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/passwords must match/i)).toBeInTheDocument();

    type(/^new password/i, "x".repeat(73));
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }));
    expect(await screen.findByText(/72 characters or fewer/i)).toBeInTheDocument();
    expect(AuthApi.resetPassword).not.toHaveBeenCalled();
  });

  it("submits the token and shows success", async () => {
    vi.mocked(AuthApi.resetPassword).mockResolvedValue({ message: "ok" });
    renderWithProviders(<ResetPassword />, { route: "/reset-password?token=abc" });
    type(/^new password/i, "NewPassword1");
    type(/confirm new password/i, "NewPassword1");
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }));

    expect(await screen.findByText(/has been reset/i)).toBeInTheDocument();
    expect(AuthApi.resetPassword).toHaveBeenCalledWith("abc", "NewPassword1");
  });

  it("shows the API's message for an expired or used token", async () => {
    vi.mocked(AuthApi.resetPassword).mockRejectedValue({ response: { status: 400, data: INVALID_RESET_LINK } });
    renderWithProviders(<ResetPassword />, { route: "/reset-password?token=used" });
    type(/^new password/i, "NewPassword1");
    type(/confirm new password/i, "NewPassword1");
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(INVALID_RESET_LINK));
  });
});
