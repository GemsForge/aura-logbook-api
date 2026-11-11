import { expect, test } from "@playwright/test";

/**
 * #329 happy path: login → "Forgot password?" → generic confirmation → emailed link → new
 * password → sign in. The API is stubbed (no backend runs here), so the stub stands in for the
 * development email sender by issuing a token and recording what each endpoint received.
 */
test("a user recovers access through the emailed reset link", async ({ page }) => {
  const token = "playwright-reset-token";
  const calls: { forgot?: unknown; reset?: unknown } = {};

  await page.route("http://127.0.0.1:5082/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname.toLowerCase();
    if (path.endsWith("/auth/forgot-password")) {
      calls.forgot = route.request().postDataJSON();
      return route.fulfill({ json: { message: "If an account exists for that email, a reset link has been sent." } });
    }
    if (path.endsWith("/auth/reset-password")) {
      calls.reset = route.request().postDataJSON();
      return route.fulfill({ json: { message: "Your password has been reset. You can now sign in." } });
    }
    return route.fulfill({ json: {} });
  });

  await page.goto("/login");
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);

  await page.getByLabel("Email").fill("alex@example.com");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText("If an account exists for that email");
  expect(calls.forgot).toEqual({ email: "alex@example.com" });

  // Follow the link the development sender would have logged.
  await page.goto(`/reset-password?token=${token}`);
  await page.getByLabel("New password", { exact: true }).fill("NewPassword1");
  await page.getByLabel("Confirm new password").fill("NewPassword1");
  await page.getByRole("button", { name: "Reset password" }).click();

  await expect(page.getByRole("status")).toContainText("Your password has been reset");
  expect(calls.reset).toEqual({ token, newPassword: "NewPassword1" });
  await page.getByRole("link", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
