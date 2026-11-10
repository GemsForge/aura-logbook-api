import { describe, expect, it } from "vitest";
import { getQuickMoodNextStep } from "./quickMoodNextStep";

describe("getQuickMoodNextStep", () => {
  it("offers a gentle grounding pause for a heavier mood", () => {
    expect(getQuickMoodNextStep("Tense")).toEqual({
      kind: "grounding",
      prompt: "If it feels useful, take one easy breath and name one thing you notice around you.",
    });
  });

  it("uses the selected pathway's prompt for a reflective mood", () => {
    expect(getQuickMoodNextStep("Centered", "Which value would you like to carry today?")).toEqual({
      kind: "reflection",
      prompt: "Which value would you like to carry today?",
    });
  });

  it("offers no suggestion when the mood has no configured rule", () => {
    expect(getQuickMoodNextStep("Neutral")).toBeNull();
  });
});
