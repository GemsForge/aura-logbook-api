import { expect, test, type Page } from "@playwright/test";
import { stubApi } from "./apiStubs";
import { testReferenceData } from "../src/test/referenceDataFixtures";
import catalog from "./fixtures/chakra-reference.json" with { type: "json" };

/** Stubs reference and mood APIs so the signed-in chakra page is exercised without account data. */
async function setupChakraPage(page: Page, entries: unknown[], interfaceMode: "light" | "dark") {
  await stubApi(page, 0, "Amethyst", true, "energy", {
    onboardingCompleted: true,
    interfaceMode,
    pathwayPreferences: { focus: ["chakra-reference"], saveBirthDetails: false },
  });
  await page.route("http://127.0.0.1:5082/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname.toLowerCase();
    if (path.endsWith("/reference-data")) return route.fulfill({ json: { ...testReferenceData, ...catalog } });
    if (/\/mood\/?$/.test(path)) return route.fulfill({ json: entries });
    if (path.endsWith("/pathway-activities")) return route.fulfill({ json: [] });
    await route.fallback();
  });
}

/** Protects responsive chakra selection, aura linking, meaning, and reflection disclosure behavior in both screen modes. */
for (const interfaceMode of ["light", "dark"] as const) for (const width of [320, 1024]) test(`chakra reference remains readable at ${width}px in ${interfaceMode} mode`, async ({ page }) => {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  await page.setViewportSize({ width, height: 900 });
  await setupChakraPage(page, [{ id: 1, userId: 7, date, moods: ["Centered"], createdAt: `${date}T12:00:00Z` }], interfaceMode);
  await page.goto("/pathways/chakra-reference");

  const reference = page.getByTestId("chakra-reference");
  await expect(reference).toBeVisible();
  await expect(page.getByRole("heading", { name: "Heart · Anāhata" })).toBeVisible();
  await expect(page.getByText(/Your centered mood \(Green\) connects here\./)).toBeVisible();
  await expect(reference.getByText("Color association")).toBeVisible();
  await expect(reference.getByText("Green", { exact: true })).toBeVisible();

  const figure = reference.getByRole("group", { name: "Choose a chakra on the seated figure" });
  await expect(figure.getByRole("button")).toHaveCount(7);
  const figureBox = await figure.boundingBox();
  const selectedIcon = page.getByRole("button", { name: /Heart · Anāhata/ }).locator("img");
  const iconBox = await selectedIcon.boundingBox();
  expect(figureBox && iconBox && Math.abs(iconBox.x + iconBox.width / 2 - (figureBox.x + figureBox.width / 2))).toBeLessThanOrEqual(1);
  expect(figureBox?.height).toBeLessThanOrEqual(width < 600 ? 270 : 360);

  const detail = page.getByTestId("chakra-detail-card");
  expect(await detail.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toMatch(/rgba\(0, 0, 0, 0\)/);
  const swatch = reference.getByTestId("chakra-color-swatch");
  await expect(swatch).toBeVisible();
  expect(await swatch.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(76, 175, 80)");

  await page.getByRole("button", { name: /Throat · Viśuddha/ }).click();
  await expect(page.getByRole("heading", { name: "Throat · Viśuddha" })).toBeVisible();
  await expect(reference.getByText("Communication, expression, and clarity.")).toBeVisible();
  await expect(reference.getByText("Blue", { exact: true })).toBeVisible();
  const throatButton = page.getByRole("button", { name: /Throat · Viśuddha/ });
  const throatIcon = await throatButton.locator("img").boundingBox();
  expect(figureBox && throatIcon && Math.abs(throatIcon.x + throatIcon.width / 2 - (figureBox.x + figureBox.width / 2))).toBeLessThanOrEqual(1);
  expect(await reference.getByTestId("chakra-color-swatch").evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(33, 150, 243)");
  await expect(page.getByText("Is there something you would like to express in your own words?", { exact: true })).toBeHidden();
  await page.getByText("Add a reflection", { exact: true }).click();
  await expect(page.getByText("Is there something you would like to express in your own words?", { exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Your reflection" })).toBeVisible();

  const [updatedFigureBox, detailBox] = await Promise.all([figure.boundingBox(), detail.boundingBox()]);
  expect(updatedFigureBox && detailBox && (width < 600
    ? updatedFigureBox.y + updatedFigureBox.height <= detailBox.y + 1
    : updatedFigureBox.x + updatedFigureBox.width <= detailBox.x + 1)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);

  await page.goto("about:blank");
  await setupChakraPage(page, [], interfaceMode);
  await page.goto("/pathways/chakra-reference");
  await expect(page.getByRole("heading", { name: "Crown · Sahasrāra" })).toBeVisible();
});
