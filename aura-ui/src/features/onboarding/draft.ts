import type { SpiritualPathway } from "@/features/auth/models/SpiritualPathway";
import type { OnboardingRequest } from "@/features/auth/models/Auth";
import type { QuizAnswers } from "./quiz";

/** Steps in order: quiz questions are one step each, keyed by question number. */
export type OnboardingStep =
  | { kind: "question"; number: number }
  | { kind: "birthday" }
  | { kind: "color" }
  | { kind: "reveal" }
  | { kind: "pathway" }
  | { kind: "reminder" };

/** Everything Alex has chosen so far; persisted so a refresh mid-flow keeps answers. */
export interface OnboardingDraft {
  stepIndex: number;
  answers: QuizAnswers;
  birthday?: string;
  colorMomentHue?: number;
  /** Set on the reveal (directly, or by picking among tied leaders). */
  pathway?: SpiritualPathway;
  focus: string[];
  checkInOpener?: string;
}

/** The full step sequence (spec flow). */
export const STEPS: readonly OnboardingStep[] = [
  ...[1, 2, 3, 4, 5].map((number) => ({ kind: "question", number }) as const),
  { kind: "birthday" },
  { kind: "color" },
  { kind: "reveal" },
  { kind: "pathway" },
  { kind: "reminder" },
];

export const EMPTY_DRAFT: OnboardingDraft = { stepIndex: 0, answers: {}, focus: [] };

const KEY = "aura.onboarding.draft";

/** Reads the saved draft; storage failures or bad data return a fresh draft. */
export function loadDraft(storage: Pick<Storage, "getItem"> | undefined = globalThis.sessionStorage): OnboardingDraft {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return EMPTY_DRAFT;
    const parsed = JSON.parse(raw) as OnboardingDraft;
    const stepIndex = Math.min(Math.max(0, Number(parsed.stepIndex) || 0), STEPS.length - 1);
    return { ...EMPTY_DRAFT, ...parsed, stepIndex, focus: Array.isArray(parsed.focus) ? parsed.focus : [] };
  } catch {
    return EMPTY_DRAFT;
  }
}

/** Saves the draft; storage may be unavailable (private mode), which is ignored. */
export function saveDraft(draft: OnboardingDraft, storage: Pick<Storage, "setItem"> | undefined = globalThis.sessionStorage) {
  try { storage?.setItem(KEY, JSON.stringify(draft)); } catch { /* best effort */ }
}

/** Removes the draft once onboarding is saved. */
export function clearDraft(storage: Pick<Storage, "removeItem"> | undefined = globalThis.sessionStorage) {
  try { storage?.removeItem(KEY); } catch { /* best effort */ }
}

/**
 * Builds the `PUT /Auth/me/onboarding` body. A skipped flow sends Mindfulness with no answers;
 * preferences are sent only when Alex picked something on the pathway page.
 */
export function buildOnboardingRequest(draft: OnboardingDraft): OnboardingRequest {
  const selectedPathway = draft.pathway ?? "Mindfulness";
  const answers = Object.entries(draft.answers)
    .filter(([, pathway]) => pathway)
    .map(([questionNumber, pathway]) => ({ questionNumber: Number(questionNumber), pathway: pathway! }))
    .sort((a, b) => a.questionNumber - b.questionNumber);
  const hasPrefs = draft.focus.length > 0 || (selectedPathway === "Mindfulness" && draft.checkInOpener);
  return {
    selectedPathway,
    birthday: draft.birthday || undefined,
    answers,
    colorMomentHue: draft.colorMomentHue,
    pathwayPreferences: hasPrefs
      ? {
          focus: draft.focus,
          checkInOpener: selectedPathway === "Mindfulness" ? draft.checkInOpener : undefined,
        }
      : undefined,
  };
}
