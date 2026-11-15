import { describe, expect, it } from "vitest";
import { CHRISTIAN_BOOKS, JEWISH_BOOKS, sacredTextBookOptions } from "./sacredTextBooks";

/** The reader's book picker must only offer names the providers resolve exactly. */
describe("sacredTextBookOptions", () => {
  it("lists the full canon for each tradition with provider spellings", () => {
    expect(CHRISTIAN_BOOKS).toHaveLength(66);
    expect(JEWISH_BOOKS).toHaveLength(39);
    expect(sacredTextBookOptions("christian")).toContain("Proverbs");
    expect(sacredTextBookOptions("jewish")).toContain("I Samuel");
  });

  it("keeps an open provider-formatted book so the picker is never blank, without duplicating known books", () => {
    expect(sacredTextBookOptions("christian", "proverbs")).toHaveLength(66);
    expect(sacredTextBookOptions("jewish", "Pirkei Avot")).toContain("Pirkei Avot");
  });

  it("sorts books alphabetically for the picker", () => {
    const options = sacredTextBookOptions("christian");
    expect(options.slice(0, 4)).toEqual(["1 Chronicles", "1 Corinthians", "1 John", "1 Kings"]);
    expect(options.indexOf("Acts")).toBeLessThan(options.indexOf("Zephaniah"));
    expect(options[options.length - 1]).toBe("Zephaniah");
  });
});
