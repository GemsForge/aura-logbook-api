import type { AuraColorDefinition } from "@/features/mood/models/aura";
import type { MoodEntry } from "@/features/mood/models/schema";
import type { ChakraDefinition, MoodDefinition } from "@/store/referenceDataApi";

/** One reflective link from a logged mood, through its aura color, to a chakra center. */
export interface ChakraMoodLink {
  moodKey: string;
  moodName: string;
  auraKey: string;
  auraName: string;
  auraHex: string;
  chakra: ChakraDefinition;
}

/** Reference lists needed to resolve mood → aura color → chakra without any API change. */
export interface ChakraLinkReference {
  moods: MoodDefinition[];
  auras: AuraColorDefinition[];
  chakras: ChakraDefinition[];
}

/** Aura definitions may store legacy underscore keys (third_eye); chakra keys use dashes. */
const normalizeChakraKey = (key: string) => key.replace(/_/g, "-").toLowerCase();

/**
 * Resolves the chakras linked to a set of logged mood keys via each aura color's `chakraKey`.
 * Unmapped moods, aura colors without a `chakraKey`, and chakras missing from `chakras` are
 * skipped silently. Each chakra appears once (first mood wins) and the list is capped so a
 * mood with many colors never makes the page noisy.
 */
export function linkMoodsToChakras(moodKeys: string[], reference: ChakraLinkReference, cap = 2): ChakraMoodLink[] {
  const links: ChakraMoodLink[] = [];
  for (const moodKey of moodKeys) {
    const mood = reference.moods.find((item) => item.key.toLowerCase() === moodKey.toLowerCase());
    for (const auraKey of mood?.auraColorKeys ?? []) {
      const aura = reference.auras.find((item) => item.key.toLowerCase() === auraKey.toLowerCase());
      if (!aura?.chakraKey) continue;
      const chakra = reference.chakras.find((item) => item.key === normalizeChakraKey(aura.chakraKey!));
      if (!chakra || links.some((link) => link.chakra.key === chakra.key)) continue;
      links.push({ moodKey, moodName: mood?.displayName ?? moodKey, auraKey: aura.key, auraName: aura.displayName, auraHex: aura.baseHex, chakra });
      if (links.length >= cap) return links;
    }
  }
  return links;
}

/** Most recent check-in by journal date, then server creation time; undefined when none exist. */
export function latestEntry(entries: MoodEntry[]): MoodEntry | undefined {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))[0];
}

/**
 * Counts distinct journal days per chakra across entries dated on or after `sinceDate`
 * (YYYY-MM-DD). Counts describe recorded days only and never imply an energetic condition.
 */
export function chakraDaysSince(entries: MoodEntry[], sinceDate: string, reference: ChakraLinkReference): Map<string, number> {
  const days = new Map<string, Set<string>>();
  for (const entry of entries.filter((item) => item.date >= sinceDate)) {
    for (const link of linkMoodsToChakras(entry.moods, reference, Number.POSITIVE_INFINITY)) {
      days.set(link.chakra.key, (days.get(link.chakra.key) ?? new Set()).add(entry.date));
    }
  }
  return new Map([...days].map(([key, set]) => [key, set.size]));
}
