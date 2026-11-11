import type { AuraColorDefinition } from "@/features/mood/models/aura";
import type { ReferenceDataConfiguration, ThemeToken } from "@/store/referenceDataApi";

/** API-shaped palette fixtures used to keep presentation tests independent of hard-coded enums. */
export const testAuraDefinitions: AuraColorDefinition[] = [
  { key: "blue", displayName: "Blue", baseHex: "#2196f3", chakraKey: "throat", description: "Clear expression.", isNeutral: false, sortOrder: 1, shades: { 50: "#e3f2fd", 100: "#bbdefb", 200: "#90caf9", 300: "#64b5f6", 400: "#42a5f5", 500: "#2196f3", 600: "#1e88e5", 700: "#1976d2", 800: "#1565c0", 900: "#0d47a1" } },
  { key: "green", displayName: "Green", baseHex: "#4caf50", chakraKey: "heart", description: "Growth and harmony.", isNeutral: false, sortOrder: 2, shades: { 50: "#e8f5e9", 100: "#c8e6c9", 200: "#a5d6a7", 300: "#81c784", 400: "#66bb6a", 500: "#4caf50", 600: "#43a047", 700: "#388e3c", 800: "#2e7d32", 900: "#1b5e20" } },
];

/** Minimal complete token set consumed by Material and Joy theme adapters. */
export const testThemeTokens: ThemeToken[] = [
  ["color.canvas", "#F7F2EA", "color"], ["color.surface", "#FFFCF7", "color"], ["color.surfaceSoft", "#EDE5D9", "color"], ["color.stone", "#DED3C3", "color"], ["color.ink", "#352D2C", "color"], ["color.inkMuted", "#665D56", "color"], ["color.line", "#D9CEC0", "color"], ["color.focus", "#654A5D", "color"], ["color.terracotta", "#C87961", "color"],
  ["font.body", "Inter, sans-serif", "font"], ["font.display", "Georgia, serif", "font"], ["radius.control", "0.625rem", "radius"], ["radius.card", "1rem", "radius"], ["radius.shell", "1.5rem", "radius"], ["shadow.soft", "0 1px 2px rgba(0,0,0,.06)", "shadow"], ["shadow.raised", "0 18px 48px rgba(0,0,0,.14)", "shadow"],
].map(([key, value, category]) => ({ key, value, category }));

/** Stable reference response shared by UI component tests and their RTK Query store. */
export const testReferenceData: ReferenceDataConfiguration = {
  pathways: [
    { key: "mindfulness", displayName: "Mindful Living", description: "Calm and self-awareness.", sortOrder: 1 },
    { key: "energy", displayName: "Astrology & Energy", description: "Energy and star signs.", sortOrder: 2 },
    { key: "faith", displayName: "Faith & Religion", description: "A journey of faith.", sortOrder: 3 },
  ],
  auras: testAuraDefinitions,
  chakras: [{ key: "throat", displayName: "Throat", description: "Clear communication.", sortOrder: 1 }],
  moods: [
    ["Empowered", "😄", "green"], ["Centered", "😊", "green"], ["Harmonious", "🕊️", "blue"],
    ["Flowing", "🚀", "green"], ["Weary", "😴", "blue"], ["Tense", "😣", "blue"],
    ["Frustrated", "😤", "blue"], ["Blocked", "😤", "blue"], ["Restless", "😰", "blue"],
    ["Disconnected", "😔", "blue"], ["Heavy", "😢", "blue"], ["Charged", "😠", "blue"],
    ["Scattered", "🤯", "blue"], ["Abundant", "🙏", "green"], ["Visionary", "🌈", "green"], ["Neutral", "😐", "blue"],
  ].map(([key, icon, auraColor]) => ({ key, icon, auraColorKeys: [auraColor], displayName: key, description: `${key} mood`, sortOrder: 1 })),
  themeTokens: testThemeTokens,
  graphics: [{ key: "avatar-1", path: "/avatars/avatar-1.jpg", displayName: "Avatar 1", alternativeText: "Profile illustration", assetType: "avatar" }],
  zodiacSigns: [{ key: "virgo", symbol: "♍", description: "Virgo", element: "earth" }],
};
