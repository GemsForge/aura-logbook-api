import { expect, type Locator } from "@playwright/test";

/** Measures the actual hovered selection colors, including ancestor surfaces for transparent fills. */
export async function expectReadableSelection(control: Locator) {
  await control.hover();
  const ratio = await control.evaluate((element) => {
    const foreground = getComputedStyle(element).color;
    let current: Element | null = element;
    let background = "";
    while (current) {
      background = getComputedStyle(current).backgroundColor;
      if (background !== "transparent" && background !== "rgba(0, 0, 0, 0)") break;
      current = current.parentElement;
    }
    const luminance = (color: string) => {
      const channels = (color.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number).map((value) => {
        const channel = value / 255;
        return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
      });
      return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
    };
    const a = luminance(foreground), b = luminance(background);
    return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  });
  expect(ratio).toBeGreaterThanOrEqual(4.5);
}
