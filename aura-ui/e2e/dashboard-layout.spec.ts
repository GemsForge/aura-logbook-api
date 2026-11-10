import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const screenshotDirectory = resolve(process.cwd(), "artifacts/dashboard-layout");
mkdirSync(screenshotDirectory, { recursive: true });

/** Produces deterministic current-week mood entries for sparse and dense visual states. */
function makeEntries(count: number) {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (index % 7), 12);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const mood = ["Centered", "Tense", "Empowered", "Weary"][index % 4];
    return {
      id: index + 1,
      userId: 7,
      date: dateKey,
      moods: [mood],
      comment: index % 2 === 0 ? `A short reflection for entry ${index + 1}.` : "",
      createdAt: `${dateKey}T12:00:00.000Z`,
    };
  });
}

/** Stubs only remote data so the test measures the actual authenticated dashboard UI. */
async function openDashboard(page: Page, entryCount: number) {
  const entries = makeEntries(entryCount);
  await page.addInitScript(() => {
    localStorage.setItem("token", "playwright-dashboard-token");
    localStorage.setItem("session_hydrated", "true");
  });

  await page.route("http://127.0.0.1:5082/api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.toLowerCase();
    let body: unknown = {};

    if (path.endsWith("/auth/me")) {
      body = {
        id: 7,
        email: "alex@example.com",
        displayName: "Alex",
        selectedPathway: "Mindfulness",
        auraColor: "blue",
        auraIntensity: 50,
        interfaceTheme: "Aurora",
      };
    } else if (path.endsWith("/mood/dashboard/summary")) {
      body = {
        totalEntries: entryCount,
        mostFrequentMood: entryCount ? "Centered" : null,
        currentStreak: 0,
        lastEntryDate: entryCount ? entries[0].date : null,
      };
    } else if (path.endsWith("/mood/dashboard/mood-breakdown")) {
      body = [];
    } else if (path.endsWith("/mood")) {
      body = entries;
    } else if (path.endsWith("/weather/current")) {
      body = { temperature: 68, description: "Clear", iconCode: "01d" };
    } else if (path.endsWith("/spotify/connection")) {
      body = { configured: false, connected: false };
    } else if (path.endsWith("/spotify/currently-playing")) {
      body = null;
    } else if (path.endsWith("/spotify/playlists")) {
      body = { items: [], hasMore: false, nextOffset: null };
    }

    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });

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
