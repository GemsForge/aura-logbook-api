import { describe, expect, it } from "vitest";
import { blendHues, scoreQuiz } from "../quiz";
import { sunSign, toggleFocus } from "../pathwayPages";
import { EMPTY_DRAFT, STEPS, buildOnboardingRequest, loadDraft } from "../draft";

describe("scoreQuiz", () => {
  it("picks the single top pathway and a runner-up", () => {
    const s = scoreQuiz({ 1: "Energy", 2: "Energy", 3: "Faith", 4: "Energy" });
    expect(s.leaders).toEqual(["Energy"]);
    expect(s.runnerUp).toBe("Faith");
  });
  it("returns every pathway tied for first", () => {
    expect(scoreQuiz({ 1: "Energy", 2: "Faith" }).leaders).toEqual(["Energy", "Faith"]);
    expect(scoreQuiz({ 1: "Mindfulness", 2: "Energy", 3: "Faith" }).leaders).toEqual(["Mindfulness", "Energy", "Faith"]);
  });
  it("defaults to Mindful Living when nothing is answered", () => {
    expect(scoreQuiz({}).leaders).toEqual(["Mindfulness"]);
  });
});

describe("blendHues", () => {
  it("wraps around 360 instead of averaging to the opposite side", () => {
    const b = blendHues({}, 350);
    expect(b?.hue).toBe(350);
    const mixed = blendHues({ 4: "Faith" }, 0); // 20° and 0°
    expect(mixed!.hue).toBeGreaterThanOrEqual(0);
    expect(mixed!.hue).toBeLessThan(20);
  });
  it("returns undefined with nothing to blend", () => {
    expect(blendHues({})).toBeUndefined();
  });
});

describe("pathway pages", () => {
  it("maps birthdays to sun signs across year boundaries", () => {
    expect(sunSign("1994-09-12")).toEqual({ sign: "Virgo", element: "Earth" });
    expect(sunSign("2000-12-25")?.sign).toBe("Capricorn");
    expect(sunSign("2000-01-10")?.sign).toBe("Capricorn");
    expect(sunSign("nope")).toBeUndefined();
  });
  it("caps Mindful intentions at two but not other pathways", () => {
    expect(toggleFocus("Mindfulness", ["calm", "rest"], "focus")).toEqual(["calm", "rest"]);
    expect(toggleFocus("Energy", ["chakras", "crystals"], "my-sign")).toHaveLength(3);
    expect(toggleFocus("Mindfulness", ["calm"], "calm")).toEqual([]);
  });
});

describe("draft", () => {
  it("builds a skipped request as Mindfulness with no answers or preferences", () => {
    expect(buildOnboardingRequest(EMPTY_DRAFT)).toEqual({ selectedPathway: "Mindfulness", birthday: undefined, answers: [], colorMomentHue: undefined, pathwayPreferences: undefined });
  });
  it("sends ordered answers and drops the opener outside Mindful Living", () => {
    const req = buildOnboardingRequest({ ...EMPTY_DRAFT, answers: { 3: "Energy", 1: "Faith" }, pathway: "Energy", focus: ["chakras"], checkInOpener: "one-minute", birthday: "1994-09-12", colorMomentHue: 210 });
    expect(req.answers.map((a) => a.questionNumber)).toEqual([1, 3]);
    expect(req.pathwayPreferences).toEqual({ focus: ["chakras"], checkInOpener: undefined });
    expect(req.birthday).toBe("1994-09-12");
  });
  it("restores a saved draft and clamps a bad step index", () => {
    const store = { getItem: () => JSON.stringify({ stepIndex: 99, answers: { 1: "Faith" } }) };
    const d = loadDraft(store);
    expect(d.stepIndex).toBe(STEPS.length - 1);
    expect(d.answers).toEqual({ 1: "Faith" });
    expect(d.focus).toEqual([]);
    expect(loadDraft({ getItem: () => "{bad" })).toEqual(EMPTY_DRAFT);
  });
});
