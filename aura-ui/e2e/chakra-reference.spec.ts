import { expect, test, type Page } from "@playwright/test";
import { stubApi } from "./apiStubs";
import { testReferenceData } from "../src/test/referenceDataFixtures";
import catalog from "./fixtures/chakra-reference.json" with { type: "json" };

/** Stubs reference and mood APIs so the signed-in chakra page is exercised without account data. */
async function setupChakraPage(page: Page, entries: unknown[]) {
  await stubApi(page, 0, "Amethyst", true, "energy", {
    onboardingCompleted: true,
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

/** Protects responsive chakra selection, aura linking, meaning, and reflection disclosure behavior. */
test("chakra reference remains usable on phone and desktop", async ({ page }) => {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  for (const width of [320, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await setupChakraPage(page, [{ id: 1, userId: 7, date, moods: ["Centered"], createdAt: `${date}T12:00:00Z` }]);
    await page.goto("/pathways/chakra-reference");

    const reference = page.getByTestId("chakra-reference");
    await expect(reference).toBeVisible();
    await expect(page.getByRole("heading", { name: "Heart · Anāhata" })).toBeVisible();
    await expect(page.getByText(/Your centered mood \(Green\) connects here\./)).toBeVisible();
    await expect(reference.getByText("Color association")).toBeVisible();
    await expect(reference.getByText("Green", { exact: true })).toBeVisible();

    const figure = reference.getByRole("group", { name: "Choose a chakra on the seated figure" });
    await expect(figure.getByRole("button")).toHaveCount(7);
    await page.getByRole("button", { name: /Throat · Viśuddha/ }).click();
    await expect(page.getByRole("heading", { name: "Throat · Viśuddha" })).toBeVisible();
    await expect(reference.getByText("Communication, expression, and clarity.")).toBeVisible();
    await expect(reference.getByText("Blue", { exact: true })).toBeVisible();
    await expect(page.getByText("Is there something you would like to express in your own words?", { exact: true })).toBeHidden();
    await page.getByText("Add a reflection", { exact: true }).click();
    await expect(page.getByText("Is there something you would like to express in your own words?", { exact: true })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Your reflection" })).toBeVisible();

    const detail = page.getByTestId("chakra-detail-card");
    const [figureBox, detailBox] = await Promise.all([figure.boundingBox(), detail.boundingBox()]);
    expect(figureBox && detailBox && (width < 600
      ? figureBox.y + figureBox.height <= detailBox.y + 1
      : figureBox.x + figureBox.width <= detailBox.x + 1)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);

    await page.goto("about:blank");
    await setupChakraPage(page, []);
    await page.goto("/pathways/chakra-reference");
    await expect(page.getByRole("heading", { name: "Crown · Sahasrāra" })).toBeVisible();
  }
});
