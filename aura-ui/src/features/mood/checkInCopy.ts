import { normalizeSpiritualPathway, type SpiritualPathway } from "@/features/auth/models/SpiritualPathway";

/** Short, shared check-in guidance keeps the question open while reflecting the user's chosen pathway. */
const CHECK_IN_SUBTEXT: Record<SpiritualPathway, string> = {
  mindfulness: "Notice what’s here—in your thoughts, feelings, or body.",
  energy: "Notice the energy or rhythms you’re experiencing.",
  faith: "Meet this moment with compassion, guided by what matters to you.",
};

/** Returns pathway-aware check-in guidance, using Mindfulness when the profile value is unavailable. */
export function getCheckInSubtext(pathway?: string | null): string {
  return CHECK_IN_SUBTEXT[normalizeSpiritualPathway(pathway) ?? "mindfulness"];
}
