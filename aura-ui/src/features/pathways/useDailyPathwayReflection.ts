import dayjs from "dayjs";
import { CHAKRA_BODY_MAP_TOP } from "./chakraReference";
import { normalizeSpiritualPathway } from "@/features/auth/models/SpiritualPathway";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { useGetAllMoodsQuery } from "@/store/moodApi";
import { useGetReferenceDataQuery, type ReferenceDataConfiguration } from "@/store/referenceDataApi";
import type { MoodEntry } from "@/features/mood/models/schema/MoodEntry";
import prompts from "../../../data/aura_logbook_journaling_prompts.json";

/** A stable invitation whose exact wording can be attached to the mood the user saves. */
export type DailyPathwayReflection = Omit<import("@/features/mood/models/schema/MoodEntry").MoodPathwayReflection, "response">;

/** Derives a factual, non-causal invitation only from three distinct recorded days in the local two-week window. */
export function energyPatternReflection(reference: ReferenceDataConfiguration | undefined, entries: MoodEntry[], date: string): DailyPathwayReflection | undefined {
  const start = dayjs(date).subtract(13, "day").format("YYYY-MM-DD");
  const candidates = (reference?.chakras ?? []).filter((chakra) => Object.hasOwn(CHAKRA_BODY_MAP_TOP, chakra.key)).map((chakra) => {
    const keys = new Set(chakra.moodAssociationKeys.map((key) => key.toLowerCase()));
    const matches = entries.filter((entry) => entry.date.slice(0, 10) >= start && entry.date.slice(0, 10) <= date && entry.moods.some((mood) => keys.has(mood.toLowerCase())));
    const days = new Set(matches.map((entry) => entry.date.slice(0, 10))).size;
    const moods = [...new Set(matches.flatMap((entry) => entry.moods.filter((mood) => keys.has(mood.toLowerCase()))))];
    return { chakra, days, moods };
  }).filter(({ days }) => days >= 3).sort((a, b) => b.days - a.days || a.chakra.key.localeCompare(b.chakra.key));
  const match = candidates[0];
  if (!match) return undefined;
  const names = match.moods.map((key) => reference?.moods.find((mood) => mood.key === key)?.displayName.toLowerCase() ?? key.toLowerCase()).join(" or ");
  return {
    sourceId: `chakra:${match.chakra.key}:${date}:${match.days}`,
    pathway: "energy", insightType: "chakra-mood-pattern",
    text: `You logged ${names} on ${match.days} different days in the past two weeks. Would you like to explore the ${match.chakra.interpretiveTheme.toLowerCase()} theme associated with ${match.chakra.sanskritName} (${match.chakra.displayName})?`,
  };
}

/** Supplies the same daily reflection to the mood log and Daily Astrology page; no reading is saved by viewing it. */
export function useDailyPathwayReflection() {
  const user = useAppSelector(selectCurrentUser);
  const pathway = normalizeSpiritualPathway(user?.selectedPathway) ?? "mindfulness";
  const date = dayjs().format("YYYY-MM-DD");
  const focus = user?.pathwayPreferences?.focus ?? [];
  const usePatterns = pathway === "energy" && (focus.includes("chakra-reference") || focus.includes("chakras"));
  const { data: reference } = useGetReferenceDataQuery();
  const { data: moods = [], isFetching } = useGetAllMoodsQuery({ startDate: dayjs().subtract(13, "day").format("YYYY-MM-DD"), endDate: date }, { skip: !user || !usePatterns });
  const id = pathway === "energy" ? "astrology-energy" : pathway === "faith" ? "faith-religion" : "mindful";
  const choices = prompts.pathways.find((item) => item.id === id)?.prompts ?? [];
  const prompt = choices[(dayjs().month() + dayjs().date()) % (choices.length || 1)];
  const fallback: DailyPathwayReflection = { sourceId: `prompt:${prompt?.id ?? id}:${date}`, pathway, insightType: "pathway-prompt", text: prompt?.question ?? "What would you like to remember about this moment?" };
  return { reflection: usePatterns ? energyPatternReflection(reference, moods, date) ?? fallback : fallback, loading: usePatterns && isFetching };
}
