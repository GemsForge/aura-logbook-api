import type { Page } from "@playwright/test";

/** Produces deterministic current-week mood entries for sparse and dense visual states. */
export function makeEntries(count: number) {
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

/**
 * Stubs only remote data so tests measure the real UI. Pass `signedIn: false` for public screens
 * as a visitor; unknown endpoints answer with an empty object.
 */
export async function stubApi(page: Page, entryCount: number, interfaceTheme = "Aurora", signedIn = true, selectedPathway = "Mindfulness") {
  const entries = makeEntries(entryCount);
  if (signedIn) {
    await page.addInitScript(() => {
      localStorage.setItem("token", "playwright-dashboard-token");
      localStorage.setItem("session_hydrated", "true");
    });
  }

  await page.route("http://127.0.0.1:5082/api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.toLowerCase();
    let body: unknown = {};

    if (path.endsWith("/auth/me")) {
      body = {
        id: 7,
        email: "alex@example.com",
        displayName: "Alex",
        selectedPathway,
        auraColor: "blue",
        auraIntensity: 50,
        interfaceTheme,
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
    } else if (/\/mood\/?$/.test(path) && route.request().method() === "POST") {
      // A quick check-in creates entry 42, which later reads and updates address by id.
      body = { id: 42, message: "Saved" };
    } else if (path.endsWith("/mood/42")) {
      body = { id: 42, userId: 7, date: entries[0]?.date ?? new Date().toISOString().slice(0, 10), moods: ["Tense"], comment: "", createdAt: new Date().toISOString() };
    } else if (/\/mood\/?$/.test(path)) {
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
}
