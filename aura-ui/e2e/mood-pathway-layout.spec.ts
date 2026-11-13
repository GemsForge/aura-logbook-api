import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { stubApi, makeEntries } from "./apiStubs";
import { testReferenceData } from "../src/test/referenceDataFixtures";

const screenshots = resolve(process.cwd(), "artifacts/mood-layout");
mkdirSync(screenshots, { recursive: true });

/** Uses the complete mood catalog and synthetic history; private account data and live providers are never called. */
async function setup(page: Page) {
  const entries = makeEntries(3).map((entry) => ({ ...entry, moods: ["Scattered"] }));
  await stubApi(page, 3, "Amethyst", true, "energy", {
    birthday: "1990-01-01", zodiacSign: "Capricorn", onboardingCompleted: true, interfaceMode: "dark",
    pathwayPreferences: { focus: ["daily-astrology", "chakra-reference"], breathingEnabled: true, saveBirthDetails: false },
  });
  await page.route("http://127.0.0.1:5082/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname.toLowerCase();
    if (path.endsWith("/reference-data")) return route.fulfill({ json: { ...testReferenceData, chakras: [{ ...testReferenceData.chakras[0], key: "root", displayName: "Root", sanskritName: "Mūlādhāra", interpretiveTheme: "Grounding", moodAssociationKeys: ["Scattered"] }] } });
    if (/\/mood\/?$/.test(path) && route.request().method() === "GET") return route.fulfill({ json: entries });
    if (path.endsWith("/insights/zodiac")) return route.fulfill({ json: { sign: "Capricorn", element: "Earth" } });
    if (path.endsWith("/astrology/daily-horoscope")) return route.fulfill({ json: { sign: "capricorn", date: new Date().toISOString().slice(0, 10), provider: "FreeAstroAPI", text: "Make room for a small adjustment." } });
    if (path.endsWith("/astrology/moon-mood-counts")) return route.fulfill({ json: { moodEntryCount: 3, entriesWithPhaseData: 3, datesWithoutPhaseData: 0, phases: [] } });
    await route.fallback();
  });
}

for (const width of [320, 768, 1024, 1440]) {
  test(`mood form follows the approved columns and scrolls emotions at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await setup(page);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/log-mood");
    const main = page.getByTestId("mood-entry-main");
    const reflection = page.getByTestId("pathway-reflection-panel");
    await expect(reflection).toContainText("Mūlādhāra");
    const mainBox = (await main.boundingBox())!;
    const reflectionBox = (await reflection.boundingBox())!;
    if (width >= 1024) {
      expect(reflectionBox.x).toBeGreaterThan(mainBox.x + mainBox.width);
      expect(Math.abs(reflectionBox.y - mainBox.y)).toBeLessThan(2);
    } else {
      expect(reflectionBox.y).toBeGreaterThanOrEqual(mainBox.y + mainBox.height);
    }
    const track = page.getByTestId("mood-carousel");
    expect(await track.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
    await page.getByRole("button", { name: "Next emotions" }).click();
    await expect.poll(() => track.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    await expect(page.getByRole("checkbox", { name: "Work", exact: true })).toBeVisible();
    expect((await page.locator(".w-md-editor").boundingBox())!.height).toBeLessThanOrEqual(150);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
    await page.getByRole("button", { name: "Previous emotions" }).click();
    await expect.poll(() => track.evaluate((element) => element.scrollLeft)).toBeLessThan(3);
    await page.mouse.move(0, 0);
    await page.screenshot({ path: resolve(screenshots, `mood-log-${width}.png`), fullPage: true });
  });
}

test("shared reflection matches Daily Astrology and its response is part of the mood save", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await setup(page);
  await page.goto("/pathways/daily-astrology");
  const reflection = page.getByTestId("pathway-reflection-panel");
  await expect(reflection).toContainText("Mūlādhāra");
  const text = await reflection.locator("blockquote").innerText();
  await page.goto("/log-mood");
  await expect(page.getByTestId("pathway-reflection-panel").locator("blockquote")).toHaveText(text);
  await page.getByRole("button", { name: "Scattered", exact: true }).click();
  await page.getByRole("checkbox", { name: "Work", exact: true }).check();
  await page.getByRole("button", { name: "Resonates", exact: true }).click();
  await expect(page.getByRole("button", { name: "Resonates", exact: true })).toHaveAttribute("aria-pressed", "true");
  const savedRequest = page.waitForRequest((request) => request.method() === "POST" && /\/api\/mood$/i.test(new URL(request.url()).pathname));
  await page.getByRole("button", { name: "Save mood", exact: true }).click();
  const payload = (await savedRequest).postDataJSON();
  expect(payload.pathwayReflection).toMatchObject({ text, response: "resonates", pathway: "energy", insightType: "chakra-mood-pattern" });
  expect(payload.impactTopics).toEqual(["Work"]);
  await expect(page).toHaveURL(/\/history$/);
});
