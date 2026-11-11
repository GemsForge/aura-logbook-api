import { expect, test, type Page } from "@playwright/test";
import { testReferenceData } from "../src/test/referenceDataFixtures";
import { mkdirSync } from "node:fs";

const families = ["Aurora", "Earth", "Ocean", "Sunset", "Amethyst", "Midnight"];
const lightCanvas: Record<string, string> = { Aurora: "#FBF6EC", Earth: "#F4F5EF", Ocean: "#EFF7F8", Sunset: "#FFF4ED", Amethyst: "#F7F2FA", Midnight: "#F1F4FB" };
mkdirSync("artifacts/mode-toggle", { recursive: true });

/** Keep the real render/state path; replace only remote services with an owner profile and journal fixtures. */
async function api(page: Page, family = "Ocean", signedIn = true, onboardingCompleted = true, selectedPathway = "Mindfulness") {
  let user: Record<string, unknown> = { id: 7, email: "alex@example.test", displayName: "Alex", birthday: null, zodiacSign: "", selectedPathway, auraColor: "blue", auraIntensity: 72,
    interfaceTheme: family, interfaceMode: "dark", onboardingCompleted, auraRevealsEnabled: false, weatherLocationMode: "Off", temperatureUnit: "F" };
  const updates: Record<string, unknown>[] = [];
  let fail = false;
  const completions: Record<string, unknown>[] = [];
  let modeGate: Promise<void> | undefined;
  let completionGate: Promise<void> | undefined;
  if (signedIn) await page.addInitScript(() => localStorage.setItem("token", "mode-verification-token"));
  await page.route("http://127.0.0.1:5082/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname.toLowerCase();
    let body: unknown = [];
    if (path.includes("/reference-data")) body = testReferenceData;
    else if (path.endsWith("/auth/me")) body = user;
    else if (path.endsWith("/auth/update")) {
      const update = route.request().postDataJSON(); updates.push(update);
      await modeGate;
      if (fail) { await route.fulfill({ status: 500, json: { message: "Temporary failure" } }); return; }
      user = { ...user, ...update }; body = user;
    } else if (path.endsWith("/auth/me/onboarding")) {
      const completion = route.request().postDataJSON(); completions.push(completion);
      await completionGate;
      user = { ...user, selectedPathway: completion.selectedPathway, onboardingCompleted: true }; body = user;
    } else if (path.includes("/dashboard/summary")) body = { totalEntries: 0, currentStreak: 0 };
    else if (path.includes("/spotify/connection")) body = { configured: false, connected: false };
    else if (path.includes("/spotify/playlists")) body = { items: [] };
    await route.fulfill({ status: 200, json: body });
  });
  return {
    updates, completions, profile: () => user, fail: () => { fail = true; },
    // Controllable responses prove that the two profile writes never overlap in either order.
    pauseMode: () => { let release!: () => void; modeGate = new Promise<void>((done) => { release = done; }); return release; },
    pauseCompletion: () => { let release!: () => void; completionGate = new Promise<void>((done) => { release = done; }); return release; },
  };
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

for (const failedSave of [false, true]) {
  test(`onboarding waits for a ${failedSave ? "failed" : "successful"} mode save before Skip`, async ({ page }) => {
    const service = await api(page, "Ocean", true, false, "Energy");
    const release = service.pauseMode();
    if (failedSave) service.fail();
    await page.goto("/onboarding");
    await page.getByRole("button", { name: "Switch to light theme" }).click();
    await expect.poll(() => service.updates.length).toBe(1);
    const skip = page.getByRole("button", { name: "Skip", exact: true });
    await expect(skip).toBeDisabled();
    expect(service.completions).toHaveLength(0);
    release();
    await expect(skip).toBeEnabled();
    await skip.click();
    await expect(page).toHaveURL(/dashboard$/);
    expect(service.profile()).toMatchObject({ selectedPathway: "Mindfulness", interfaceMode: failedSave ? "dark" : "light" });
    expect(service.updates).toHaveLength(1);
    expect(service.completions).toHaveLength(1);
  });
}
test("onboarding waits for a mode save before Enter my space", async ({ page }) => {
  const service = await api(page, "Ocean", true, false);
  const release = service.pauseMode();
  await page.addInitScript(() => sessionStorage.setItem("aura.onboarding.draft", JSON.stringify({ stepIndex: 9, answers: {}, focus: [], pathway: "Energy" })));
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  const finish = page.getByRole("button", { name: "Enter my space" }).filter({ visible: true });
  await expect(finish).toBeDisabled();
  expect(service.completions).toHaveLength(0);
  release();
  await expect(finish).toBeEnabled(); await finish.click();
  await expect(page).toHaveURL(/dashboard$/);
  expect(service.profile()).toMatchObject({ selectedPathway: "Energy", interfaceMode: "light" });
});
test("mode switching waits for onboarding completion", async ({ page }) => {
  const service = await api(page, "Ocean", true, false, "Energy");
  const release = service.pauseCompletion();
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Skip", exact: true }).click();
  await expect.poll(() => service.completions.length).toBe(1);
  await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeDisabled();
  expect(service.updates).toHaveLength(0);
  release();
  await expect(page).toHaveURL(/dashboard$/);
  expect(service.profile()).toMatchObject({ selectedPathway: "Mindfulness", interfaceMode: "dark" });
});

/** A real banner must not fetch the legacy full-size image unless its selected variant fails. */
test("banner downloads only the active variant across mode changes", async ({ page }) => {
  await api(page);
  const images: string[] = [];
  page.on("request", (request) => { const path = new URL(request.url()).pathname; if (path.includes("/backgrounds/banner-")) images.push(path); });
  await page.goto("/history");
  await expect(page.locator('img[src="/theme-assets/backgrounds/banner-ocean-dark.png"]')).toHaveJSProperty("naturalWidth", 1774);
  await page.waitForLoadState("networkidle");
  expect(images).toEqual(["/theme-assets/backgrounds/banner-ocean-dark.png"]);
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator('img[src="/theme-assets/backgrounds/banner-ocean-light.png"]')).toHaveJSProperty("naturalWidth", 1774);
  await page.waitForLoadState("networkidle");
  expect(images).toEqual(["/theme-assets/backgrounds/banner-ocean-dark.png", "/theme-assets/backgrounds/banner-ocean-light.png"]);
});
for (const missingOriginal of [false, true]) {
  test(`banner requests fallback only after variant failure${missingOriginal ? " and stops if both fail" : ""}`, async ({ page }) => {
    await api(page);
    const images: string[] = [];
    page.on("request", (request) => { const path = new URL(request.url()).pathname; if (path.includes("/backgrounds/banner-")) images.push(path); });
    await page.route("**/backgrounds/banner-ocean-dark.png", (route) => route.fulfill({ status: 404, body: "Missing variant" }));
    if (missingOriginal) await page.route("**/backgrounds/banner-ocean.png", (route) => route.fulfill({ status: 404, body: "Missing original" }));
    await page.goto("/history");
    const fallback = page.locator('img[src="/theme-assets/backgrounds/banner-ocean.png"]');
    if (missingOriginal) await expect(fallback).toBeHidden();
    else await expect(fallback).toHaveJSProperty("naturalWidth", 1774);
    await page.waitForLoadState("networkidle");
    expect(images).toEqual(["/theme-assets/backgrounds/banner-ocean-dark.png", "/theme-assets/backgrounds/banner-ocean.png"]);
    await expect(page.getByRole("heading", { name: "Mood History", exact: true })).toBeVisible();
  });
}
