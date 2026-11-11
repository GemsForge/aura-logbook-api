import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { normalizeSpiritualPathway } from "@/features/auth/models/SpiritualPathway";
import { PathwayReflectionArt } from "./PathwayReflectionArt";

/** #318: each user sees only their own pathway art; moon phases belong to Astrology & Energy. */
describe("PathwayReflectionArt", () => {
  it.each([
    ["Mindfulness", "mindful-gentle-landscape"],
    ["Faith", "faith-religion-open-book"],
    ["Energy", "astrology-energy-moon-phases"],
  ] as const)("shows only the %s illustration", (pathway, file) => {
    render(<PathwayReflectionArt pathway={pathway} />);
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(1);
    expect(images[0].getAttribute("src")).toContain(file);
    if (pathway !== "Energy") expect(images[0].getAttribute("src")).not.toContain("astrology");
  });
});

describe("normalizeSpiritualPathway", () => {
  it("accepts enum keys and display labels and rejects unknown values", () => {
    expect(normalizeSpiritualPathway("Mindful Living")).toBe("mindfulness");
    expect(normalizeSpiritualPathway("astrology & energy")).toBe("energy");
    expect(normalizeSpiritualPathway("Faith")).toBe("faith");
    expect(normalizeSpiritualPathway("Something else")).toBeUndefined();
    expect(normalizeSpiritualPathway(undefined)).toBeUndefined();
  });
});
