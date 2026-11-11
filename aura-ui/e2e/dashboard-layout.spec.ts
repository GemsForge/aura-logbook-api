import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { stubApi } from "./apiStubs";

const screenshotDirectory = resolve(process.cwd(), "artifacts/dashboard-layout");
mkdirSync(screenshotDirectory, { recursive: true });

/** Opens the signed-in Today screen on stubbed data and waits for its primary content. */
async function openDashboard(page: Page, entryCount: number, interfaceTheme = "Aurora") {
  await stubApi(page, entryCount, interfaceTheme);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { level: 1, name: /^Good (morning|afternoon|evening), Alex\.$/ })).toBeVisible();
  await expect(page.getByRole("group", { name: "How are you feeling today?" })).toBeVisible();
}

const entryCounts = [0, 1, 3, 10] as const;

for (const entryCount of entryCounts) {
  test(`desktop Today fits its primary content with ${entryCount} entries at 1280×720`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await openDashboard(page, entryCount);

    const checkIn = await page.getByRole("group", { name: "How are you feeling today?" }).boundingBox();
    const week = await page.getByRole("heading", { name: "This week" }).locator("xpath=..").boundingBox();
    const prompt = await page.getByRole("heading", { name: "A thought for today" }).locator("xpath=..").boundingBox();
    expect(checkIn).not.toBeNull();
    expect(week).not.toBeNull();
    expect(prompt).not.toBeNull();
    expect(checkIn!.y + checkIn!.height).toBeLessThanOrEqual(720);
    expect(week!.y + week!.height).toBeLessThanOrEqual(720);
    expect(prompt!.y + prompt!.height).toBeLessThanOrEqual(720);

    const nestedScrollbars = await page.evaluate(() => Array.from(document.querySelectorAll("body *"))
      .filter((element) => {
        const style = getComputedStyle(element);
        return /(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 1;
      })
      .map((element) => `${element.tagName}.${String(element.className).split(" ")[0]}`));
    expect(nestedScrollbars).toEqual([]);
    await page.screenshot({ path: resolve(screenshotDirectory, `today-${entryCount}-entries-1280x720.png`) });
  });

  test(`mobile Today has no horizontal overflow with ${entryCount} entries at 375px`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await openDashboard(page, entryCount);

    const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
    await expect(page.getByRole("heading", { name: "This week" })).toBeVisible();
    await page.screenshot({ path: resolve(screenshotDirectory, `today-${entryCount}-entries-375x812.png`) });
  });
}

/** Canvas color each theme must put on the shell; mirrors src/theme/interfaceThemes.ts. */
const themeCanvases = {
  Aurora: "#170F26",
  Earth: "#1C2A22",
  Ocean: "#0C2233",
  Sunset: "#351E2B",
  Amethyst: "#21182F",
  Midnight: "#0E1529",
  Ivory: "#FBF6EC",
} as const;

for (const [theme, canvas] of Object.entries(themeCanvases)) {
  for (const viewport of [{ width: 1280, height: 720 }, { width: 375, height: 812 }]) {
    test(`${theme} theme applies to Today at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await openDashboard(page, 3, theme);

      // The saved profile preference must drive the shell's theme variables.
      await expect
        .poll(() => page.evaluate(() => {
          for (const element of [document.documentElement, document.body, ...Array.from(document.querySelectorAll("body *"))]) {
            const value = getComputedStyle(element).getPropertyValue("--al-theme-canvas").trim();
            if (value) return value.toUpperCase();
          }
          return "";
        }))
        .toBe(canvas);
      // Quick mood labels must stay readable (WCAG 4.5:1) against their own button fill.
      const moodContrast = await page.getByRole("button", { name: "Centered", exact: true }).evaluate((button) => {
        const parse = (value: string) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
        const luminance = (rgb: number[]) => {
          const [r, g, b] = rgb.map((channel) => {
            const c = channel / 255;
            return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        const style = getComputedStyle(button);
        const [hi, lo] = [luminance(parse(style.color)), luminance(parse(style.backgroundColor))].sort((a, b) => b - a);
        return (hi + 0.05) / (lo + 0.05);
      });
      expect(moodContrast).toBeGreaterThanOrEqual(4.5);

      const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
      expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
      await page.screenshot({ path: resolve(screenshotDirectory, `theme-${theme.toLowerCase()}-${viewport.width}.png`) });
    });
  }
}
