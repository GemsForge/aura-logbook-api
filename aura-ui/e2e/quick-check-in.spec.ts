import { expect, test } from "@playwright/test";
import { stubApi } from "./apiStubs";

/**
 * Pass 3 of the Today brief: the saved moment keeps keyboard focus and attaches details to the
 * entry it just created. The check-in card sizes to its content, so the cards below may move down
 * in direct response to the tap, but must not move up, jitter sideways, or stay moved after "Done".
 */
// "Tense" gets the grounding prompt; "Empowered" gets the pathway's reflection prompt, checked on
// every pathway because the prompts differ in length (Energy's is the longest).
const cases = [
  { mood: "Tense", pathway: "Mindfulness" },
  { mood: "Empowered", pathway: "Mindfulness" },
  { mood: "Empowered", pathway: "Energy" },
  { mood: "Empowered", pathway: "Faith" },
];
for (const { mood, pathway } of cases) for (const viewport of [{ width: 1280, height: 720 }, { width: 375, height: 812 }]) {
  test(`saving a ${mood} check-in on ${pathway} keeps the layout steady at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await stubApi(page, 3, "Aurora", true, pathway);
    await page.goto("/dashboard");
    const week = page.getByRole("heading", { name: "This week" });
    await expect(week).toBeVisible();
    const before = await week.boundingBox();

    await page.getByRole("button", { name: mood, exact: true }).click();
    const saved = page.getByRole("group", { name: "Check-in saved" });
    await expect(saved).toBeFocused();
    await expect(page.getByText("A gentle next step")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add a note or photo" })).toBeEnabled();

    const after = await week.boundingBox();
    expect(after!.y).toBeGreaterThanOrEqual(before!.y);
    expect(after!.x).toBe(before!.x);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);

    await page.getByRole("button", { name: "Done" }).click();
    await expect(page.getByRole("group", { name: "How are you feeling today?" }).getByRole("button").first()).toBeFocused();
    expect((await week.boundingBox())!.y).toBe(before!.y);
  });
}

test("adding a note updates the saved entry instead of creating another", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await stubApi(page, 3);
  const writes: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET" && request.method() !== "OPTIONS" && new URL(request.url()).pathname.toLowerCase().includes("/mood")) {
      writes.push(`${request.method()} ${new URL(request.url()).pathname.toLowerCase().replace(/^.*\/mood/, "/mood")}`);
    }
  });
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Tense", exact: true }).click();
  await page.getByRole("button", { name: "Add a note or photo" }).click();
  await page.getByRole("button", { name: "Save details" }).click();

  await expect.poll(() => writes).toContain("PUT /mood/42");
  expect(writes.filter((write) => write.startsWith("POST"))).toHaveLength(1);
});
