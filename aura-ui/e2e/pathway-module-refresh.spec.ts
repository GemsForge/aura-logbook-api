import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { stubApi, makeEntries } from "./apiStubs";
import { expectReadableSelection } from "./moduleAssertions";
import { testReferenceData } from "../src/test/referenceDataFixtures";

const screenshots = resolve(process.cwd(), "artifacts/module-refresh");
mkdirSync(screenshots, { recursive: true });

/** Uses synthetic accounts and local responses; browser checks never spend external provider credits. */
async function setup(page: Page, pathway: string, framework?: string, mode = "dark", unavailable = false) {
  const requestedPassages: string[] = [];
  await stubApi(page, 3, "Amethyst", true, pathway, {
    onboardingCompleted: true, interfaceMode: mode,
    pathwayPreferences: { focus: pathway === "faith" ? ["sacred-texts", "faith-practice-check-in"] : ["calm"], breathingEnabled: true, faithTradition: framework },
  });
  await page.route("http://127.0.0.1:5082/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/reference-data")) return route.fulfill({ json: testReferenceData });
    if (url.pathname.endsWith("/pathway-activities")) return route.fulfill({ json: [] });
    if (/\/mood\/?$/.test(url.pathname)) return route.fulfill({ json: makeEntries(3) });
    if (url.pathname.endsWith("/faith/passage")) {
      const selected = url.searchParams.get("framework") ?? "";
      requestedPassages.push(selected);
      if (unavailable) return route.fulfill({ status: 502, json: { message: "Fixture provider unavailable" } });
      return route.fulfill({ json: { framework: selected, text: `A synthetic ${selected} reading for layout verification.`, reference: "Fixture reference", translation: "Fixture translation", attribution: "Synthetic test content", readingUrl: "https://example.com/source" } });
    }
    await route.fallback();
  });
  return requestedPassages;
}

/** Checks the route-level hierarchy and overflow, then saves a real browser rendering for review. */
async function capture(page: Page, name: string) {
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  await expect.poll(() => page.locator("img").evaluateAll((images) => images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src))).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve(screenshots, `${name}.png`), fullPage: true });
}

for (const width of [320, 768, 1440]) {
  test(`Mindful Living guide and practice log work for a legacy profile at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await setup(page, "mindfulness", undefined, width === 768 ? "light" : "dark");
    await page.goto("/pathways/mindfulness-guide");
    await expect(page.getByRole("heading", { name: "Mindfulness, in practice" })).toBeVisible();
    await page.getByRole("button", { name: "DBT skills", exact: true }).click();
    await expectReadableSelection(page.getByRole("button", { name: "DBT skills", exact: true }));
    await page.getByRole("button", { name: "Describe", exact: true }).click();
    await expectReadableSelection(page.getByRole("button", { name: "Describe", exact: true }));
    await expect(page.getByRole("heading", { name: "Describe", exact: true })).toBeVisible();
    await expect(page.getByText("Put one thing you notice into words:", { exact: false })).toBeVisible();
    await capture(page, `mindfulness-${width}`);
    await page.goto("/pathways/practice-log");
    await expect(page.getByRole("button", { name: "Save practice", exact: true })).toBeVisible();
    await capture(page, `practice-${width}`);
  });

  test(`daily reading is a general quote without a framework at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const requests = await setup(page, "faith", undefined, width === 768 ? "light" : "dark");
    await page.goto("/pathways/sacred-texts");
    await expect(page.getByRole("heading", { name: "Quote of the day" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Word of the Day" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Open (YouVersion|Quran|Sefaria)/ })).toHaveCount(0);
    expect(requests).toEqual([]);
    await capture(page, `quote-${width}`);
    await page.goto("/pathways/faith-practice-check-in");
    await expect(page.getByText("Sacred-text reading", { exact: true })).toBeVisible();
    await expectReadableSelection(page.getByRole("button", { name: "Save practice choices", exact: true }));
    await capture(page, `faith-practice-${width}`);
  });
}

for (const [framework, publisher] of [["christian", "YouVersion Bible App"], ["muslim", "Quran.com"], ["jewish", "Sefaria"]]) {
  test(`${framework} daily reading requests and links only its selected framework`, async ({ page }) => {
    const requests = await setup(page, "faith", framework);
    await page.goto("/pathways/sacred-texts");
    await expect(page.getByText(`“A synthetic ${framework} reading for layout verification.”`)).toBeVisible();
    await expect(page.getByRole("link", { name: `Open ${publisher}`, exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /^Open (YouVersion|Quran|Sefaria)/ })).toHaveCount(1);
    expect(requests).toEqual([framework]);
    await capture(page, `passage-${framework}`);
  });
}

test("an unavailable selected provider does not become a neutral quote or another tradition", async ({ page }) => {
  const requests = await setup(page, "faith", "muslim", "dark", true);
  await page.goto("/pathways/sacred-texts");
  await expect(page.getByText("A passage for your selected framework is unavailable right now.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Quote of the day" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /^Open (YouVersion|Quran|Sefaria)/ })).toHaveCount(0);
  expect(requests.every((framework) => framework === "muslim")).toBe(true);
});
