import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { stubApi } from "./apiStubs";
import { scanContrast } from "./contrast";

const screenshotDirectory = resolve(process.cwd(), "artifacts/theme-screens");
mkdirSync(screenshotDirectory, { recursive: true });

const themes = ["Aurora", "Earth", "Ocean", "Sunset", "Amethyst", "Midnight", "Ivory"] as const;
const viewports = [{ width: 1280, height: 720 }, { width: 375, height: 812 }] as const;

/** Every routed screen. Today's layout fit is covered separately in dashboard-layout.spec.ts. */
const screens = [
  { name: "today", path: "/dashboard" },
  { name: "home", path: "/" },
  { name: "login", path: "/login" },
  { name: "register", path: "/register" },
  { name: "not-found", path: "/no-such-page" },
  { name: "log-mood", path: "/log-mood" },
  { name: "reflections", path: "/history" },
  { name: "gallery", path: "/gallery" },
  { name: "insights", path: "/insights" },
] as const;

for (const screen of screens) {
  for (const theme of themes) {
    for (const viewport of viewports) {
      test(`${screen.name} in ${theme} at ${viewport.width}px is themed and readable`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await stubApi(page, 3, theme);
        const pageErrors: string[] = [];
        page.on("pageerror", (error) => pageErrors.push(error.message));
        await page.goto(screen.path);
        await page.waitForLoadState("networkidle");

        await expect(page.getByText("Unexpected Application Error")).toHaveCount(0);
        expect(pageErrors).toEqual([]);

        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow).toBeLessThanOrEqual(0);

        if (screen.name === "log-mood") {
          // Toolbar icons are SVGs the text scan cannot see; they need 3:1 against the toolbar.
          const iconContrast = await page.locator(".w-md-editor-toolbar li > button").first().evaluate((button) => {
            const parse = (value: string) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
            const luminance = (rgb: number[]) => {
              const [r, g, b] = rgb.map((channel) => {
                const c = channel / 255;
                return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
              });
              return 0.2126 * r + 0.7152 * g + 0.0722 * b;
            };
            const toolbar = button.closest(".w-md-editor-toolbar")!;
            const [hi, lo] = [luminance(parse(getComputedStyle(button).color)), luminance(parse(getComputedStyle(toolbar).backgroundColor))].sort((a, b) => b - a);
            return (hi + 0.05) / (lo + 0.05);
          });
          expect(iconContrast).toBeGreaterThanOrEqual(3);
        }

        const result = await page.evaluate(scanContrast);
        await page.screenshot({ path: resolve(screenshotDirectory, `${screen.name}-${theme.toLowerCase()}-${viewport.width}.png`), fullPage: true });
        writeFileSync(resolve(screenshotDirectory, `${screen.name}-${theme.toLowerCase()}-${viewport.width}.json`), JSON.stringify(result, null, 2));
        expect(result.checked).toBeGreaterThan(0);
        expect(result.failures).toEqual([]);
      });
    }
  }
}
