import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { stubApi, makeEntries } from "./apiStubs";
import { expectReadableSelection } from "./moduleAssertions";
import { testReferenceData } from "../src/test/referenceDataFixtures";
import catalog from "./fixtures/chakra-reference.json" with { type: "json" };

const screenshots = resolve(process.cwd(), "artifacts/pathway-layout");
mkdirSync(screenshots, { recursive: true });

/** Public reference fixture plus synthetic readings exercise layout without spending provider credits. */
async function setup(page: Page) {
  await stubApi(page, 3, "Amethyst", true, "energy", {
    birthday: "1990-01-01", onboardingCompleted: true, interfaceMode: (await page.viewportSize())?.width === 768 ? "light" : "dark",
    pathwayPreferences: { focus: ["daily-astrology", "chakra-reference"], breathingEnabled: true, saveBirthDetails: true, birthTime: "08:30", birthPlace: "Chicago" },
  });
  await page.route("http://127.0.0.1:5082/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname.toLowerCase();
    if (path.endsWith("/pathway-activities")) return route.fulfill({ json: [] });
    if (path.endsWith("/reference-data")) return route.fulfill({ json: { ...testReferenceData, ...catalog } });
    if (/\/mood\/?$/.test(path)) return route.fulfill({ json: makeEntries(3) });
    if (path.endsWith("/insights/zodiac")) return route.fulfill({ json: { sign: "Virgo", element: "Earth" } });
    if (path.endsWith("/astrology/daily-horoscope")) return route.fulfill({ json: { sign: "virgo", date: "2026-11-13", provider: "FreeAstroAPI", text: "Make room for a small adjustment. Clarity may come from tending to one thing at a time." } });
    if (path.endsWith("/astrology/birth-chart")) return route.fulfill({ json: { provider: "FreeAstrologyAPI", retrievedAt: "2026-11-13", chart: [{ name: "Sun", sign: "Virgo" }, { name: "Moon", sign: "Taurus" }, { name: "Ascendant", sign: "Libra" }] } });
    if (path.endsWith("/astrology/moon-mood-counts")) return route.fulfill({ json: { moodEntryCount: 44, entriesWithPhaseData: 44, datesWithoutPhaseData: 0, phases: ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous", "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"].map((phase, index) => ({ phase, entryCount: index + 2, moodCounts: { Centered: index + 1 } })) } });
    await route.fallback();
  });
}

for (const width of [320, 768, 1024, 1440]) {
  test(`approved pathway references fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await setup(page);
    await page.goto("/pathways/daily-astrology");
    await expect(page.getByText("Make room for a small adjustment.", { exact: false })).toBeVisible();
    await expect(page.getByText("Taurus", { exact: true })).toBeVisible();
    const readingColumns = await page.getByTestId("astrology-reading-grid").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
    expect(readingColumns).toBe(width >= 900 ? 2 : 1);
    await expect(page.getByRole("list", { name: "Mood entry counts by moon phase" }).getByRole("listitem")).toHaveCount(8);
    await expect(page.getByRole("img", { name: "Virgo zodiac illustration" })).toBeVisible();
    await page.getByRole("button", { name: /Full Moon/ }).click();
    await expect(page.getByRole("heading", { name: "Recorded with full moon" })).toBeVisible();
    await expect(page.getByRole("img", { name: "Full Moon phase illustration" })).toBeVisible();
    await expectReadableSelection(page.getByRole("button", { name: /Full Moon/ }));
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: resolve(screenshots, `astrology-${width}.png`), fullPage: true });

    await page.goto("/pathways/chakra-reference");
    const centers = page.getByTestId("chakra-reference-grid");
    // Legacy underscore aliases in the fixture must not produce nine rows for a seven-center wiki.
    // Named symbol controls replace overlapping body hit targets; their accessible names retain Sanskrit terms.
    await expect(centers.getByRole("group", { name: "Choose a chakra" }).getByRole("button")).toHaveCount(7);
    await centers.getByRole("button", { name: /Throat · Viśuddha/ }).click();
    await expect(page.getByRole("heading", { name: "Throat · Viśuddha" })).toBeVisible();
    await expectReadableSelection(centers.getByRole("button", { name: /Throat · Viśuddha/ }));
    await expect(page.getByRole("img", { name: "Seated human silhouette with seven colored centers aligned along the spine" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: resolve(screenshots, `chakra-${width}.png`), fullPage: true });

    await page.goto("/pathways/breathing");
    await page.getByRole("button", { name: "Start breathing" }).click();
    await expect(page.getByRole("button", { name: "Pause breathing" })).toBeVisible();
    await expect(page.getByRole("img")).toHaveAccessibleName(/Inhale|Exhale/);
    await page.getByRole("button", { name: "Pause breathing" }).click();
    await page.getByRole("button", { name: "Reset breathing" }).click();
    await expect(page.getByRole("img")).toHaveAccessibleName("Ready");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: resolve(screenshots, `breathing-${width}.png`), fullPage: true });
  });
}
