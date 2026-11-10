import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { stubApi } from "./apiStubs";
import { scanContrast } from "./contrast";

const screenshotDirectory = resolve(process.cwd(), "artifacts/profile-and-public");
mkdirSync(screenshotDirectory, { recursive: true });

const themes = ["Aurora", "Earth", "Ocean", "Sunset", "Amethyst", "Midnight", "Ivory"] as const;
const canvases: Record<(typeof themes)[number], string> = {
  Aurora: "#170F26", Earth: "#1C2A22", Ocean: "#0C2233", Sunset: "#351E2B",
  Amethyst: "#21182F", Midnight: "#0E1529", Ivory: "#FBF6EC",
};
const viewports = [{ width: 1280, height: 720 }, { width: 375, height: 812 }] as const;

/** Reads the shell's current theme canvas variable. */
const shellCanvas = (page: Page) => page.evaluate(() => {
  for (const element of [document.documentElement, document.body, ...Array.from(document.querySelectorAll("body *"))]) {
    const value = getComputedStyle(element).getPropertyValue("--al-theme-canvas").trim();
    if (value) return value.toUpperCase();
  }
  return "";
});

/** Opens the profile editor the way a user would at the current width. */
async function openProfile(page: Page, width: number) {
  if (width < 900) {
    await page.getByRole("navigation", { name: "Mobile journal navigation" }).getByRole("button", { name: "Profile" }).click();
  } else {
    await page.getByRole("button", { name: "Open profile menu" }).click();
    await page.getByRole("button", { name: "Edit profile" }).click();
  }
  await expect(page.getByRole("radiogroup", { name: "Interface theme" })).toBeVisible();
  // "Visible" fires mid fade-in; wait until the dialog is fully opaque before measuring or capturing it.
  await expect
    .poll(() => page.locator(".MuiDialog-container").evaluate((element) => getComputedStyle(element).opacity))
    .toBe("1");
}

for (const theme of themes) {
  for (const viewport of viewports) {
    test(`profile editor in ${theme} at ${viewport.width}px is readable`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await stubApi(page, 3, theme);
      await page.goto("/dashboard");
      await openProfile(page, viewport.width);

      const result = await page.evaluate(scanContrast);
      // Viewport capture: a full-page capture stretches the fixed dialog backdrop and misplaces fixed layers.
      await page.screenshot({ path: resolve(screenshotDirectory, `profile-${theme.toLowerCase()}-${viewport.width}.png`) });
      expect(result.checked).toBeGreaterThan(0);
      expect(result.failures).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    });
  }
}

test("every theme can be chosen by keyboard and previews across the app", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await stubApi(page, 3, "Aurora");
  await page.goto("/dashboard");
  await openProfile(page, 1280);

  const group = page.getByRole("radiogroup", { name: "Interface theme" });
  await expect(group.getByRole("radio")).toHaveCount(themes.length);
  await group.getByRole("radio", { name: /Aurora/ }).focus();

  // Arrow keys walk the radio group in order; each choice previews immediately.
  for (const theme of themes.slice(1)) {
    await page.keyboard.press("ArrowRight");
    const radio = group.getByRole("radio", { name: new RegExp(theme) });
    await expect(radio).toBeChecked();
    await expect(radio).toBeFocused();
    await expect.poll(() => shellCanvas(page)).toBe(canvases[theme]);
  }

  // The focused option must show a visible focus indicator even though the native radio is hidden.
  const focusVisible = await page.evaluate(() => {
    const radio = document.activeElement as HTMLElement;
    const card = radio.closest("label") ?? radio.parentElement!;
    const style = getComputedStyle(card);
    const ring = (s: CSSStyleDeclaration) => (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== "none";
    return ring(style) || ring(getComputedStyle(radio.parentElement!));
  });
  expect(focusVisible).toBe(true);
});

for (const screen of [{ name: "home", path: "/" }, { name: "login", path: "/login" }, { name: "register", path: "/register" }, { name: "not-found", path: "/no-such-page" }]) {
  for (const viewport of viewports) {
    test(`${screen.name} signed out at ${viewport.width}px uses the default theme and is readable`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await stubApi(page, 0, "Aurora", false);
      const pageErrors: string[] = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));
      await page.goto(screen.path);
      await page.waitForLoadState("networkidle");

      expect(pageErrors).toEqual([]);
      // Visitors have no saved preference, so the shell resolves to Aurora.
      expect(await shellCanvas(page)).toBe(canvases.Aurora);
      // Signed-in-only navigation must not appear for a visitor.
      await expect(page.getByRole("button", { name: "Open profile menu" })).toHaveCount(0);
      const result = await page.evaluate(scanContrast);
      await page.screenshot({ path: resolve(screenshotDirectory, `signed-out-${screen.name}-${viewport.width}.png`), fullPage: true });
      expect(result.failures).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    });
  }
}
