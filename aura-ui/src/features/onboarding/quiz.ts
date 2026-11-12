import type { SpiritualPathway } from "@/features/auth/models/SpiritualPathway";

/** One answer card: its copy, the pathway it scores for, and the hidden hue it adds to the orb. */
export interface QuizOption {
  label: string;
  pathway: SpiritualPathway;
  /** Approximate hue (degrees) used to tint the onboarding orb; the server derives the real aura. */
  hue: number;
}

/** One pathway-quiz question with exactly one option per pathway. */
export interface QuizQuestion {
  number: number;
  prompt: string;
  options: readonly QuizOption[];
}

/**
 * The five onboarding questions (docs/ux/onboarding-aura-spec.md §1). Each answer is one point
 * for its pathway; card order is shuffled at render time so the pattern isn't obvious.
 */
export const QUIZ_QUESTIONS: readonly QuizQuestion[] = [
  {
    number: 1,
    prompt: "When a hard day hits, what helps most?",
    options: [
      { label: "Slowing down and breathing through it", pathway: "Mindfulness", hue: 230 },
      { label: "Knowing there's a bigger cycle or season at play", pathway: "Energy", hue: 290 },
      { label: "Turning to a belief, value, or practice that grounds me", pathway: "Faith", hue: 60 },
    ],
  },
  {
    number: 2,
    prompt: "What would you like to work on?",
    options: [
      { label: "Feeling calmer day to day", pathway: "Mindfulness", hue: 175 },
      { label: "Understanding my energy and moods", pathway: "Energy", hue: 300 },
      { label: "Feeling connected to what gives my life meaning", pathway: "Faith", hue: 55 },
    ],
  },
  {
    number: 3,
    prompt: "When you reflect, you usually…",
    options: [
      { label: "Notice what's happening in my body and mind", pathway: "Mindfulness", hue: 160 },
      { label: "Wonder what the moon, stars or my aura are saying", pathway: "Energy", hue: 270 },
      { label: "Look for meaning through my beliefs or values", pathway: "Faith", hue: 70 },
    ],
  },
  {
    number: 4,
    prompt: "A good check-in would leave you feeling…",
    options: [
      { label: "Clear and grounded", pathway: "Mindfulness", hue: 200 },
      { label: "In tune and aligned", pathway: "Energy", hue: 250 },
      { label: "Supported by what matters to me", pathway: "Faith", hue: 20 },
    ],
  },
  {
    number: 5,
    prompt: "What kind of daily nudge would you welcome?",
    options: [
      { label: "A short mindful prompt", pathway: "Mindfulness", hue: 190 },
      { label: "A cosmic or energy insight", pathway: "Energy", hue: 280 },
      { label: "A reflection shaped by my beliefs or values", pathway: "Faith", hue: 50 },
    ],
  },
];

/** Question number → chosen pathway. Missing keys are skipped questions. */
export type QuizAnswers = Partial<Record<number, SpiritualPathway>>;

/** Result of scoring: points per pathway and the pathway(s) tied for first. */
export interface QuizScore {
  points: Record<SpiritualPathway, number>;
  /** Top-scoring pathways. Empty answers yield ["Mindfulness"] (the skip default). */
  leaders: SpiritualPathway[];
  /** The highest-scoring pathway outside the leaders with at least one point, if any. */
  runnerUp?: SpiritualPathway;
}

const ORDER: SpiritualPathway[] = ["Mindfulness", "Energy", "Faith"];

/**
 * Scores the quiz (spec §2): one point per answer; ties for first are all returned so Alex can
 * choose; no answers falls back to Mindful Living.
 */
export function scoreQuiz(answers: QuizAnswers): QuizScore {
  const points: Record<SpiritualPathway, number> = { Mindfulness: 0, Energy: 0, Faith: 0 };
  for (const pathway of Object.values(answers)) {
    if (pathway) points[pathway] += 1;
  }
  const top = Math.max(...ORDER.map((p) => points[p]));
  if (top === 0) return { points, leaders: ["Mindfulness"] };
  const leaders = ORDER.filter((p) => points[p] === top);
  const rest = ORDER.filter((p) => !leaders.includes(p) && points[p] > 0).sort((a, b) => points[b] - points[a]);
  return { points, leaders, runnerUp: rest[0] };
}

/**
 * Blends the hues of the chosen answers (and optional color-moment hue, weighted 1.5) as vectors so
 * hues wrap correctly around 360°. Returns undefined when there is nothing to blend.
 */
export function blendHues(answers: QuizAnswers, colorMomentHue?: number): { hue: number; strength: number } | undefined {
  let x = 0;
  let y = 0;
  let weight = 0;
  const add = (hue: number, w: number) => {
    const r = (hue * Math.PI) / 180;
    x += Math.cos(r) * w;
    y += Math.sin(r) * w;
    weight += w;
  };
  for (const q of QUIZ_QUESTIONS) {
    const pathway = answers[q.number];
    const option = q.options.find((o) => o.pathway === pathway);
    if (option) add(option.hue, 1);
  }
  if (colorMomentHue !== undefined) add(colorMomentHue, 1.5);
  if (weight === 0) return undefined;
  const hue = Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);
  return { hue, strength: Math.sqrt(x * x + y * y) / weight };
}

/** Display names used across onboarding copy. */
export const PATHWAY_NAMES: Record<SpiritualPathway, string> = {
  Mindfulness: "Mindful Living",
  Energy: "Astrology & Energy",
  Faith: "Faith & Religion",
};
