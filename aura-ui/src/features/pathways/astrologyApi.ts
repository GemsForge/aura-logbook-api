import api from "@/api/api";

/** One phase's mood-entry totals and counts for each selected mood key. */
export interface MoonPhaseMoodCount {
  phase: string;
  entryCount: number;
  moodCounts: Record<string, number>;
}

/** Date-bounded phase summary with explicit coverage for provider lookup failures. */
export interface MoonPhaseMoodInsights {
  startDate: string;
  endDate: string;
  moodEntryCount: number;
  entriesWithPhaseData: number;
  datesWithoutPhaseData: number;
  phases: MoonPhaseMoodCount[];
}

/** A provider-sourced daily sun-sign reading. */
export interface DailyHoroscope {
  sign: string;
  date: string;
  text: string;
  provider: string;
}

/** Loads the signed-in user's reading, derived from their profile birthday. */
export async function getDailyHoroscope() {
  const response = await api.get<DailyHoroscope>("astrology/daily-horoscope");
  return response.data;
}

/** Loads phase counts for only the authenticated user's own mood entries. */
export async function getMoonPhaseMoodInsights(startDate: string, endDate: string) {
  const response = await api.get<MoonPhaseMoodInsights>("astrology/moon-mood-counts", { params: { startDate, endDate } });
  return response.data;
}
