import { describe, expect, it } from "vitest";
import { resolvePathwayFocus } from "./pathwayResources";

describe("module availability for existing profiles", () => {
  it("enables Mindful Living for older profiles without module preferences", () => {
    expect(resolvePathwayFocus("Mindful Living")).toEqual(["mindfulness-guide", "practice-log"]);
    expect(resolvePathwayFocus("mindfulness", ["calm", "rest"])).toEqual(["mindfulness-guide", "practice-log"]);
  });
  it("respects explicit off and individual module choices", () => {
    expect(resolvePathwayFocus("mindfulness", [])).toEqual([]);
    expect(resolvePathwayFocus("mindfulness", ["mindfulness-guide"])).toEqual(["mindfulness-guide"]);
  });
  it("does not add a second pathway or replace other saved module choices", () => {
    expect(resolvePathwayFocus("energy", ["chakra-reference"])).toEqual(["chakra-reference"]);
    expect(resolvePathwayFocus(undefined)).toEqual([]);
  });
});
