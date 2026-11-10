import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { stubApi } from "./apiStubs";

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
] as const;

interface ContrastFailure { text: string; color: string; background: string; ratio: number; required: number }

/**
 * Scans visible text for WCAG contrast against its composited solid background. Text over
 * artwork or gradients is skipped because its real backdrop cannot be read from CSS; those
 * areas rely on the banner scrim and still need a visual check.
 */
function scanContrast(): { failures: ContrastFailure[]; checked: number; skippedOverImage: number } {
  const parse = (value: string) => {
    const parts = (value.match(/[\d.]+/g) ?? []).map(Number);
    return { r: parts[0] ?? 0, g: parts[1] ?? 0, b: parts[2] ?? 0, a: parts.length > 3 ? parts[3] : 1 };
  };
  type Rgba = ReturnType<typeof parse>;
  const over = (top: Rgba, bottom: Rgba): Rgba => ({
    r: top.r * top.a + bottom.r * (1 - top.a), g: top.g * top.a + bottom.g * (1 - top.a),
    b: top.b * top.a + bottom.b * (1 - top.a), a: 1,
  });
  const luminance = (c: Rgba) => {
    const [r, g, b] = [c.r, c.g, c.b].map((channel) => {
      const v = channel / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const failures: ContrastFailure[] = [];
  const seen = new Set<string>();
  let checked = 0;
  let skippedOverImage = 0;

  for (const element of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
    const text = Array.from(element.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent ?? "").join("").trim();
    if (!text || /^(?:\p{Extended_Pictographic}|\s|‍|️)+$/u.test(text)) continue;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) === 0 || rect.width === 0 || rect.height === 0) continue;
    if (element.closest("[disabled], [aria-disabled='true'], [aria-hidden='true']")) continue;

    const layers: Rgba[] = [];
    let overImage = false;
    let opacity = 1;
    for (let node: HTMLElement | null = element; node; node = node.parentElement) {
      const nodeStyle = getComputedStyle(node);
      opacity *= Number(nodeStyle.opacity);
      if (nodeStyle.backgroundImage !== "none") { overImage = true; break; }
      const background = parse(nodeStyle.backgroundColor);
      if (background.a > 0) layers.push(background);
      if (background.a >= 1) break;
    }
    if (overImage) { skippedOverImage += 1; continue; }
    // Fully transparent text (e.g. an empty date field's placeholder sections) is not visible.
    if (opacity === 0) continue;

    let background: Rgba = { r: 255, g: 255, b: 255, a: 1 };
    for (const layer of layers.reverse()) background = over(layer, background);
    const foregroundRaw = parse(style.color);
    const foreground = over({ ...foregroundRaw, a: foregroundRaw.a * opacity }, background);
    const [hi, lo] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    const ratio = (hi + 0.05) / (lo + 0.05);
    const size = parseFloat(style.fontSize);
    const large = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700);
    const required = large ? 3 : 4.5;
    checked += 1;
    if (ratio < required) {
      const key = `${style.color}|${background.r},${background.g},${background.b}|${text.slice(0, 30)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      failures.push({
        text: text.slice(0, 50), color: style.color,
        background: `rgb(${Math.round(background.r)}, ${Math.round(background.g)}, ${Math.round(background.b)})`,
        ratio: Math.round(ratio * 100) / 100, required,
      });
    }
  }
  return { failures, checked, skippedOverImage };
}

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
