import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

/**
 * Regenerate both contact sheets from the local HTML so previews cannot drift
 * from the named assets. Run from any directory after installing aura-ui deps:
 * node aura-ui/public/theme-assets/previews/render-preview.mjs
 */
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
  await page.goto(new URL('./index.html', import.meta.url).href);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode()));
  });
  await page.screenshot({ path: fileURLToPath(new URL('./contact-sheet.png', import.meta.url)), fullPage: true });
  await page.locator('#theme-backdrops').screenshot({ path: fileURLToPath(new URL('./backdrops-contact-sheet.png', import.meta.url)) });
  console.log('Rendered full library and theme backdrop contact sheets.');
} finally {
  await browser.close();
}
