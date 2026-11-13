import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { stubApi, makeEntries } from "./apiStubs";
import { testReferenceData } from "../src/test/referenceDataFixtures";

const screenshots = resolve(process.cwd(), "artifacts/mood-layout");
mkdirSync(screenshots, { recursive: true });

/** Uses the complete mood catalog and synthetic history; private account data and live providers are never called. */
async function setup(page: Page, profile: Record<string, unknown> = {}) {
  const entries = makeEntries(3).map((entry) => ({ ...entry, moods: ["Scattered"] }));
  await stubApi(page, 3, "Amethyst", true, "energy", {
    birthday: "1990-01-01", zodiacSign: "Capricorn", onboardingCompleted: true, interfaceMode: "dark",
    pathwayPreferences: { focus: ["daily-astrology", "chakra-reference"], breathingEnabled: true, saveBirthDetails: false },
    ...profile,
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

for (const interfaceMode of ["light", "dark"]) {
  test(`saved aura is shared by Today and the entry highlights in ${interfaceMode} mode`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await setup(page, { interfaceMode, auraRevealsEnabled: true });
    await page.route("http://127.0.0.1:5082/api/aura/current", (route) => route.fulfill({ json: { hue: 135, chroma: .14, lightness: .7, strength: .6, intensity: 60, contributors: ["Recent check-ins"] } }));
    await page.goto("/dashboard");
    await expect(page.getByTestId("current-aura-mark")).toBeVisible();
    const orb = page.getByRole("img", { name: "Current aura color" });
    const todayColor = await orb.evaluate((element) => getComputedStyle(element).backgroundImage);
    await page.getByRole("button", { name: "Why this color?" }).click();
    await expect(page.getByRole("dialog")).toContainText("Clear expression.");
    await expect(page.getByRole("dialog")).toContainText("In your check-ins: Scattered");
    await page.getByText("How this color took shape", { exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText("Recent check-ins");
    await page.keyboard.press("Escape");
    await page.goto("/log-mood");
    await expect(page.getByTestId("current-aura-mark")).toBeVisible();
    await expect.poll(() => page.getByRole("img", { name: "Current aura color" }).evaluate((element) => getComputedStyle(element).backgroundImage)).toBe(todayColor);
    const main = page.getByTestId("mood-entry-main");
    expect(await main.evaluate((element) => getComputedStyle(element).backgroundImage)).toContain("linear-gradient");
    const storedAccent = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--aura-accent"));
    await page.getByRole("button", { name: "Tense", exact: true }).click();
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--aura-accent"))).toBe(storedAccent);
    await expect(page.getByRole("button", { name: "Why this color?" })).toHaveCount(0);
    await page.screenshot({ path: resolve(screenshots, `mood-aura-${interfaceMode}.png`), fullPage: true });
  });
}

test("disabled aura reveals hide the shared mark and skip the derived aura request", async ({ page }) => {
  await setup(page, { auraRevealsEnabled: false });
  const auraRequests: string[] = [];
  page.on("request", (request) => { if (new URL(request.url()).pathname.endsWith("/aura/current")) auraRequests.push(request.url()); });
  await page.goto("/log-mood");
  await expect(page.getByTestId("mood-entry-main")).toBeVisible();
  await expect(page.getByTestId("current-aura-mark")).toHaveCount(0);
  expect(auraRequests).toEqual([]);
});
