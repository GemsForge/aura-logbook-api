/** Curated official destinations for users who choose a tradition; Aura does not connect accounts. */
export const FAITH_RESOURCES = [
  { key: "christian", name: "YouVersion Bible App", description: "Bible reading, audio, plans, and scripture tools.", url: "https://www.youversion.com/the-bible-app/" },
  { key: "muslim", name: "Quran.com", description: "Qur’an reading, translations, recitations, and study tools.", url: "https://quran.com/" },
  { key: "jewish", name: "Sefaria", description: "Jewish texts including Tanakh, Talmud, Mishnah, and siddurim.", url: "https://www.sefaria.org/" },
] as const;

/** One gentle, non-prescriptive chakra prompt per named energy center. */
export const CHAKRA_REFLECTIONS = [
  { name: "Root", color: "Red", prompt: "What helps you feel supported or grounded today?" },
  { name: "Sacral", color: "Orange", prompt: "Where did creativity or enjoyment find room today?" },
  { name: "Solar plexus", color: "Yellow", prompt: "Where did you feel able to make a choice for yourself?" },
  { name: "Heart", color: "Green", prompt: "What felt caring, connected, or tender today?" },
  { name: "Throat", color: "Blue", prompt: "What would you like to express in your own words?" },
  { name: "Third eye", color: "Indigo", prompt: "What perspective are you curious to explore?" },
  { name: "Crown", color: "Violet", prompt: "What gives this moment a sense of meaning, if anything?" },
] as const;

/** Broad optional faith traditions are explicit and never inferred from a user's identity. */
export const FAITH_TRADITIONS = [
  { key: "christian", label: "Christian" }, { key: "muslim", label: "Muslim" },
  { key: "jewish", label: "Jewish" }, { key: "other", label: "Another tradition" },
  { key: "custom", label: "My own wording" }, { key: "neutral", label: "Neutral reflection" },
] as const;
/** Shared pathway module catalog used by profile toggles and the signed-in navigation. */
export const PATHWAY_MODULES = {
  mindfulness: [
    { key: "mindfulness-guide", label: "Mindful Living", hint: "Concepts and DBT skills", path: "/pathways/mindfulness-guide" },
    { key: "practice-log", label: "Practice log", hint: "Your optional practice record", path: "/pathways/practice-log" },
  ],
  energy: [
    { key: "daily-astrology", label: "Astrology & Energy", hint: "Daily horoscope, chart, and moon insights", path: "/pathways/daily-astrology" },
    { key: "chakra-reference", label: "Chakra reference", hint: "Seven centers and reflection themes", path: "/pathways/chakra-reference" },
  ],
  faith: [
    { key: "faith-practice-check-in", label: "Faith & Religion", hint: "Practice check-in and insights", path: "/pathways/faith-practice-check-in" },
    { key: "sacred-texts", label: "Sacred texts", hint: "For your selected framework", path: "/pathways/sacred-texts" },
  ],
} as const;

/** Resolves legacy pathway labels to the shared module catalog key. */
export function pathwayModuleKey(pathway?: string | null): keyof typeof PATHWAY_MODULES | undefined {
  switch (pathway?.trim().toLowerCase()) {
    case "mindfulness": case "mindful living": return "mindfulness";
    case "energy": case "astrology & energy": return "energy";
    case "faith": case "faith & religion": case "christian faith": return "faith";
    default: return undefined;
  }
}

