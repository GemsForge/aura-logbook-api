import { describe, expect, it } from "vitest";
import catalog from "../../../data/aura_logbook_daily_quotes.json";
import { dailyFaithQuote } from "./dailyQuote";

describe("dailyFaithQuote", () => {
  it("keeps a local day's quote stable and rotates on the next day", () => {
    const morning = dailyFaithQuote(new Date(2026, 10, 13, 0, 1));
    expect(dailyFaithQuote(new Date(2026, 10, 13, 23, 59))).toEqual(morning);
    expect(dailyFaithQuote(new Date(2026, 10, 14))).not.toEqual(morning);
  });

  it("only uses the existing Aura-authored faith and religion catalog", () => {
    const choices = catalog.pathways.find((item) => item.id === "faith-religion")!.quotes;
    for (let day = 1; day <= 10; day++) {
      const quote = dailyFaithQuote(new Date(2026, 10, day));
      expect(choices).toContainEqual(quote);
      expect(quote.author).toBe("Aura Logbook");
    }
  });
});
