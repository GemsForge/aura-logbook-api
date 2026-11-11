import { expect, test, type Page } from "@playwright/test";
import { testReferenceData } from "../src/test/referenceDataFixtures";
import { mkdirSync } from "node:fs";

const families = ["Aurora", "Earth", "Ocean", "Sunset", "Amethyst", "Midnight"];
const lightCanvas: Record<string, string> = { Aurora: "#FBF6EC", Earth: "#F4F5EF", Ocean: "#EFF7F8", Sunset: "#FFF4ED", Amethyst: "#F7F2FA", Midnight: "#F1F4FB" };
mkdirSync("artifacts/mode-toggle", { recursive: true });

/** Keep the real render/state path; replace only remote services with an owner profile and journal fixtures. */
async function api(page: Page, family = "Ocean", signedIn = true, onboardingCompleted = true) {
  let user: Record<string, unknown> = { id: 7, email: "alex@example.test", displayName: "Alex", birthday: null, zodiacSign: "", selectedPathway: "Mindfulness", auraColor: "blue", auraIntensity: 72,
    interfaceTheme: family, interfaceMode: "dark", onboardingCompleted, auraRevealsEnabled: false, weatherLocationMode: "Off", temperatureUnit: "F" };
  const updates: Record<string, unknown>[] = [];
  let fail = false;
  if (signedIn) await page.addInitScript(() => localStorage.setItem("token", "mode-verification-token"));
  await page.route("http://127.0.0.1:5082/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname.toLowerCase();
    let body: unknown = [];
    if (path.includes("/reference-data")) body = testReferenceData;
    else if (path.endsWith("/auth/me")) body = user;
    else if (path.endsWith("/auth/update")) {
      const update = route.request().postDataJSON(); updates.push(update);
      if (fail) { await route.fulfill({ status: 500, json: { message: "Temporary failure" } }); return; }
      user = { ...user, ...update }; body = user;
    } else if (path.includes("/dashboard/summary")) body = { totalEntries: 0, currentStreak: 0 };
    else if (path.includes("/spotify/connection")) body = { configured: false, connected: false };
    else if (path.includes("/spotify/playlists")) body = { items: [] };
    await route.fulfill({ status: 200, json: body });
  });
  return { updates, profile: () => user, fail: () => { fail = true; } };
}
/** Read the final palette consumed by the real page rather than a selected-swatch marker. */
async function canvas(page: Page) { return page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--al-theme-canvas").trim()); }

for (const width of [320, 1440]) {
  for (const family of families) {
    test(`${family} mode saves and restores independently at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const service = await api(page, family);
      await page.goto("/dashboard");
      await page.getByRole("button", { name: "Switch to light theme" }).click();
      await expect.poll(() => canvas(page)).toBe(lightCanvas[family]);
      await expect(page.getByRole("button", { name: "Switch to dark theme" })).toBeEnabled();
      expect(service.updates[0]).toEqual({ id: 7, email: "alex@example.test", displayName: "Alex", selectedPathway: "Mindfulness", interfaceMode: "light" });
      expect(service.profile()).toMatchObject({ interfaceTheme: family, auraColor: "blue", auraIntensity: 72 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `artifacts/mode-toggle/${family.toLowerCase()}-light-${width}.png`, fullPage: true });
      await page.reload();
      await expect.poll(() => canvas(page)).toBe(lightCanvas[family]);
      const toggle = page.getByRole("button", { name: "Switch to dark theme" });
      await toggle.focus(); await page.keyboard.press("Enter");
      await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeEnabled();
      expect(service.profile()).toMatchObject({ interfaceTheme: family, interfaceMode: "dark", auraColor: "blue", auraIntensity: 72 });
    });
  }
  test(`public mode persists through reload at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 }); await api(page, "Aurora", false);
    await page.goto("/login"); await page.getByRole("button", { name: "Switch to light theme" }).click();
    await expect.poll(() => canvas(page)).toBe(lightCanvas.Aurora);
    await page.reload(); await expect(page.getByRole("button", { name: "Switch to dark theme" })).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
  test(`onboarding has a mode control without the app header at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 }); await api(page, "Ocean", true, false);
    await page.goto("/onboarding"); await expect(page.locator("header")).toHaveCount(0);
    await page.getByRole("button", { name: "Switch to light theme" }).click();
    await expect.poll(() => canvas(page)).toBe(lightCanvas.Ocean);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/mode-toggle/onboarding-light-${width}.png`, fullPage: true });
  });
}
test("failed account save restores the visible mode", async ({ page }) => {
  const service = await api(page); await page.goto("/dashboard"); service.fail();
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "previous mode has been restored" })).toBeVisible();
  await expect.poll(() => canvas(page)).toBe("#0C2233");
});
test("profile family selection keeps mode and retains the separate aura controls", async ({ page }) => {
  const service = await api(page); await page.goto("/dashboard");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.getByRole("button", { name: "Switch to dark theme" })).toBeEnabled();
  await page.getByRole("button", { name: "Open profile menu" }).click();
  await page.getByRole("button", { name: "Edit profile", exact: true }).click();
  await expect(page.getByRole("radio", { name: "Ivory" })).toHaveCount(0);
  await expect(page.getByRole("radio", { name: "Light", exact: true })).toBeChecked();
  await page.getByRole("radio", { name: "Earth", exact: true }).check();
  await expect.poll(() => canvas(page)).toBe(lightCanvas.Earth);
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect.poll(() => service.profile().interfaceTheme).toBe("Earth");
  expect(service.profile()).toMatchObject({ interfaceMode: "light", auraColor: "blue", auraIntensity: 72 });
});
