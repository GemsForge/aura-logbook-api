import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { stubApi } from "./apiStubs";
import { testReferenceData } from "../src/test/referenceDataFixtures";

/** Use synthetic accounts with the real local catalog; no astrology-provider request is needed. */
async function setup(page: Page) {
  await stubApi(page, 0, "Ocean", true, "energy", { birthday: "1990-01-01", onboardingCompleted: true, interfaceMode: "dark", pathwayPreferences: { focus: ["daily-astrology"], saveBirthDetails: true, birthTime: "08:30", birthPlace: "Chicago, IL" } });
  await page.route("http://127.0.0.1:5082/api/**", async (route) => {
    if (new URL(route.request().url()).pathname.endsWith("/reference-data")) return route.fulfill({ json: testReferenceData });
    await route.fallback();
  });
}

/** Select only a listed option after searching the catalog. */
async function choose(page: Page, label: string, value: string) {
  const field = page.getByRole("combobox", { name: label, exact: true });
  await expect(field).toBeEnabled();
  await field.fill(value);
  await page.getByRole("option", { name: value, exact: true }).click();
}

for (const width of [320, 1440]) {
  test(`birthplace presets preserve saved details and select canonical location at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await setup(page);
    await page.goto("/pathways/breathing");
    await page.getByRole("button", { name: "Open profile menu", exact: true }).click();
    await page.getByRole("button", { name: "Edit profile", exact: true }).click();
    const tab = page.getByRole("tab", { name: "My Pathway", exact: true });
    if (await tab.isVisible()) await tab.click();
    else await page.getByRole("button", { name: "My Pathway", exact: true }).click();
    await expect(page.getByText("Saved birthplace: Chicago, IL", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Change birthplace" }).click();
    await choose(page, "Birth country", "United States");
    await choose(page, "Birth state or region", "Illinois");
    await choose(page, "Birth city", "Chicago");
    const city = page.getByRole("combobox", { name: "Birth city", exact: true });
    await city.scrollIntoViewIfNeeded();
    const cityBounds = (await city.boundingBox())!;
    expect(cityBounds.x).toBeGreaterThanOrEqual(0);
    expect(cityBounds.x + cityBounds.width).toBeLessThanOrEqual(width);
    const dialog = page.getByRole("dialog", { name: "Edit Profile" });
    expect(await dialog.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(false);
    mkdirSync(resolve("artifacts/birthplace-presets"), { recursive: true });
    await page.screenshot({ path: resolve(`artifacts/birthplace-presets/profile-${width}.png`), fullPage: true });
    await city.click();
    await expect(page.getByRole("option", { name: "Chicago", exact: true })).toBeVisible();
    await page.screenshot({ path: resolve(`artifacts/birthplace-presets/cities-${width}.png`), fullPage: true });
    await city.press("Escape");
    const saved = page.waitForRequest((request) => request.method() === "PUT" && /\/auth\/update$/i.test(new URL(request.url()).pathname));
    await page.getByRole("button", { name: "Save Changes", exact: true }).click();
    expect((await saved).postDataJSON().pathwayPreferences).toMatchObject({ saveBirthDetails: true, birthTime: "08:30", birthPlace: "Chicago, Illinois, US" });
  });
}
