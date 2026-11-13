import catalog from "../../../data/aura_logbook_daily_quotes.json";

const faithQuotes = catalog.pathways.find((pathway) => pathway.id === "faith-religion")!.quotes;

/** Selects an existing Aura-authored quote by local calendar day, without network requests or saved state. */
export function dailyFaithQuote(date = new Date()) {
  // UTC arithmetic on local calendar fields keeps the selection stable through daylight-saving changes.
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  return faithQuotes[((day % faithQuotes.length) + faithQuotes.length) % faithQuotes.length];
}
