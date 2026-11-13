import { chromium } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Exports the #391 chakra and zodiac illustration SVGs to 768px transparent PNGs (matching the
 * existing chakra-symbols exports) and renders a dedicated contact sheet from index.html.
 * Run after generate-pathway-artwork.py: node aura-ui/public/theme-assets/previews/render-pathway-artwork.mjs
 */
const root = fileURLToPath(new URL('..', import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, 'asset-manifest.json'), 'utf8'));
const assets = manifest.assets.filter(a => a.collection === 'chakra-illustrations' || a.collection === 'zodiac-illustrations');

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 768, height: 768 } });
  for (const asset of assets) {
    const svg = await readFile(path.join(root, asset.filename), 'utf8');
    const [, w, h] = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
    const height = Math.round(768 * Number(h) / Number(w));
    await page.setViewportSize({ width: 768, height });
    await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:768px;height:${height}px}</style>${svg}`);
    const out = path.join(root, asset.png_export);
    await mkdir(path.dirname(out), { recursive: true });
    await page.locator('svg').screenshot({ path: out, omitBackground: true });
  }
  const sheet = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await sheet.goto(new URL('./index.html', import.meta.url).href);
  await sheet.evaluate(() => Promise.all([...document.images].map(image => image.decode().catch(() => undefined))));
  await sheet.locator('#pathway-artwork').screenshot({ path: fileURLToPath(new URL('./pathway-artwork-contact-sheet.png', import.meta.url)) });
  console.log(`Exported ${assets.length} PNGs and pathway-artwork-contact-sheet.png.`);
} finally {
  await browser.close();
}
