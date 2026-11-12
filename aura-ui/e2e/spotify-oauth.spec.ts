import { expect, test } from "@playwright/test";
import { testReferenceData } from "../src/test/referenceDataFixtures";

const apiOrigin = "http://127.0.0.1:5082/api";
const frontendOrigin = "http://127.0.0.1:59783";

/** Exercises the real popup and callback bridge while Spotify and API responses stay mocked. */
for (const result of ["connected", "denied"] as const) {
  test(`Spotify ${result} returns to the signed-in mobile-width Aura page`, async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      localStorage.setItem("token", "spotify-oauth-e2e-token");
      localStorage.setItem("session_hydrated", "true");
    });

    let connected = false;
    await context.route(`${apiOrigin}/**`, async (route) => {
      const requestUrl = new URL(route.request().url());
      const path = requestUrl.pathname.toLowerCase();
      let body: unknown = {};
      if (path.endsWith("/reference-data")) body = testReferenceData;
      else if (path.endsWith("/auth/me")) {
        body = {
          id: 7,
          email: "alex@example.test",
          displayName: "Alex",
          selectedPathway: "Mindfulness",
          onboardingCompleted: true,
          auraColor: "blue",
          auraIntensity: 50,
          interfaceTheme: "Aurora",
        };
      } else if (path.endsWith("/spotify/connect")) {
        body = { authorizationUrl: "https://accounts.spotify.com/authorize?state=e2e" };
      } else if (path.endsWith("/spotify/connection")) {
        body = { configured: true, connected };
      } else if (path.endsWith("/spotify/currently-playing")) body = null;
      else if (path.endsWith("/spotify/playlists")) body = { items: [], hasMore: false, nextOffset: null };
      else if (/\/mood\/?$/.test(path)) body = [];
      else if (path.endsWith("/mood/dashboard/summary")) body = { totalEntries: 0, currentStreak: 0, longestStreak: 0 };

      await route.fulfill({ status: 200, json: body });
    });
    await context.route("https://accounts.spotify.com/**", async (route) => {
      connected = result === "connected";
      await route.fulfill({
        status: 302,
        headers: { location: `${frontendOrigin}/dashboard?spotify=${result}` },
      });
    });

    await page.goto("/dashboard");
    await page.getByText("Music", { exact: true }).click();
    const popupPromise = page.waitForEvent("popup");
    await page.getByRole("button", { name: "Connect Spotify" }).click();
    const callbackWindow = await popupPromise;

    if (result === "connected") {
      await expect(page.getByRole("button", { name: "Disconnect" })).toBeVisible();
      await expect(page.getByText("Spotify connected.")).toBeVisible();
    } else {
      await expect(page.getByText("Spotify access wasn’t approved. You can connect whenever you’re ready.")).toBeVisible();
    }
    await expect.poll(() => callbackWindow.isClosed()).toBe(true);
    await expect(page).toHaveURL(/\/dashboard$/);
  });
}

test("Spotify callback without an Aura session shows recovery instead of the login page", async ({ page }) => {
  await page.goto("/dashboard?spotify=connected");

  await expect(page.getByRole("heading", { name: "Aura Logbook" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Spotify is connected. Return to the Aura Logbook app to continue.");
  await expect(page.getByRole("heading", { name: "Sign in" })).toHaveCount(0);
});
