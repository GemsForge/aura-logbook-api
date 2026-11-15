import type { MoodDefinition } from "@/store/referenceDataApi";
import type { AuraColorDefinition } from "./models/aura";
import { getQuickMoodNextStep } from "./quickMoodNextStep";

/** Leads with the existing reflective mood set, then groups each section by configured color; this is display order, never a mood score. */
export function orderMoodChoices(moods: MoodDefinition[], auras: AuraColorDefinition[]): MoodDefinition[] {
  const colorOrder = new Map(auras.map((aura) => [aura.key, aura.sortOrder]));
  const leading = (mood: MoodDefinition) => getQuickMoodNextStep(mood.key)?.kind === "reflection" ? 0 : 1;
  return [...moods].sort((left, right) => leading(left) - leading(right)
    || (colorOrder.get(left.auraColorKeys[0]) ?? Number.MAX_SAFE_INTEGER) - (colorOrder.get(right.auraColorKeys[0]) ?? Number.MAX_SAFE_INTEGER)
    || left.displayName.localeCompare(right.displayName));
}
