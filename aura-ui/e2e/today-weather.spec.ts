import { expect, test, type Page } from "@playwright/test";
import { stubApi } from "./apiStubs";

/**
 * #331: Today's weather follows the user's own setting. No default city, no prompt on page
 * load, city-level coordinates only, and the greeting row stays put in every state.
 */
const viewports = [{ width: 1280, height: 720 }, { width: 375, height: 812 }];

/** Records every weather request the page makes. */
function watchWeather(page: Page) {
  const requests: URL[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.toLowerCase().endsWith("/weather/current")) requests.push(url);
  });
  return requests;
}

async function openToday(page: Page, profile: Record<string, unknown>) {
  await stubApi(page, 3, "Aurora", true, "Mindfulness", profile);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "How are you feeling today?" })).toBeVisible();
}

for (const viewport of viewports) {
  test.describe(`at ${viewport.width}px`, () => {
    test.use({ viewport });

    test("location off shows a quiet prompt and sends no weather request", async ({ page }) => {
      const requests = watchWeather(page);
      await openToday(page, { weatherLocationMode: "Off" });
      await expect(page.getByRole("button", { name: "Set your location" })).toBeVisible();
      await expect(page.getByText(/Atlanta/)).toHaveCount(0);
      expect(requests).toHaveLength(0);

      await page.getByRole("button", { name: "Set your location" }).click();
      await expect(page.getByRole("group", { name: "Weather location" })).toBeVisible();
    });

    test("a typed city shows that city's weather in the saved unit", async ({ page }) => {
      const requests = watchWeather(page);
      await openToday(page, { weatherLocationMode: "City", weatherCity: "Lisbon", weatherCountry: "PT", temperatureUnit: "C" });
      await expect(page.getByText("68°C · Clear")).toBeVisible();
      expect(requests[0].searchParams.get("city")).toBe("Lisbon");
      expect(requests[0].searchParams.get("unit")).toBe("C");
      expect(requests[0].searchParams.has("lat")).toBe(false);
    });

    test("device location, already allowed, sends only rounded coordinates", async ({ page, context }) => {
      await context.grantPermissions(["geolocation"]);
      await context.setGeolocation({ latitude: 33.748995, longitude: -84.387982 });
      const requests = watchWeather(page);
      await openToday(page, { weatherLocationMode: "Device" });
      await expect(page.getByText("68°F · Clear")).toBeVisible();
      expect(requests[0].searchParams.get("lat")).toBe("33.75");
      expect(requests[0].searchParams.get("lon")).toBe("-84.39");
    });

    test("device location not allowed asks via the setting, never a browser prompt", async ({ page }) => {
      const requests = watchWeather(page);
      await openToday(page, { weatherLocationMode: "Device" });
      await expect(page.getByRole("button", { name: "Allow location for weather" })).toBeVisible();
      expect(requests).toHaveLength(0);
    });

    test("the weather chip does not shift Today between empty and loaded states", async ({ page }) => {
      await openToday(page, { weatherLocationMode: "Off" });
      const emptyTop = (await page.getByRole("heading", { name: "How are you feeling today?" }).boundingBox())!.y;
      await openToday(page, { weatherLocationMode: "City", weatherCity: "Lisbon" });
      await expect(page.getByText("68°F · Clear")).toBeVisible();
      const loadedTop = (await page.getByRole("heading", { name: "How are you feeling today?" }).boundingBox())!.y;
      expect(loadedTop).toBe(emptyTop);
    });
  });
}
