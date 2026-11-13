import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CssVarsProvider } from "@mui/joy/styles";
import { MoonPhaseDisc } from "./MoonPhaseDisc";

describe("lunar phase illustrations", () => {
  it.each(["light", "dark"] as const)("keeps moon shadow dark and illuminated regions light in %s mode", (scheme) => {
    const phases = ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous", "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"];
    const { container } = render(<CssVarsProvider defaultMode={scheme} modeStorageKey={`moon-test-${scheme}`}><>{phases.map((phase) => <MoonPhaseDisc key={phase} phase={phase} />)}</></CssVarsProvider>);
    for (const disc of container.querySelectorAll("svg")) {
      // Literal artwork fills deliberately bypass the scheme-inverting Joy neutral scale.
      expect(disc.querySelector(":scope > circle")).toHaveAttribute("fill", "#242833");
      const illuminated = disc.querySelector("g > path, g > circle");
      if (disc.getAttribute("aria-label")?.startsWith("New Moon")) expect(illuminated).toBeNull();
      else expect(illuminated).toHaveAttribute("fill", "#ece9df");
    }
  });

  it("distinguishes the eight phase categories and mirrors waning illumination", () => {
    const phases = ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous", "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"];
    const { container } = render(<>{phases.map((phase) => <MoonPhaseDisc key={phase} phase={phase} />)}</>);
    const discs = [...container.querySelectorAll("svg")];
    expect(screen.getAllByRole("img")).toHaveLength(8);
    expect(discs[0].querySelector("g")).toBeNull();
    expect(discs[4].querySelector("g circle")).not.toBeNull();
    const waxingPaths = discs.slice(1, 4).map((disc) => disc.querySelector("path")?.getAttribute("d"));
    expect(new Set(waxingPaths).size).toBe(3);
    for (const [waxingIndex, waningIndex] of [[1, 7], [2, 6], [3, 5]]) {
      expect(discs[waningIndex].querySelector("path")?.getAttribute("d")).toBe(discs[waxingIndex].querySelector("path")?.getAttribute("d"));
      expect(discs[waningIndex].querySelector("g")).toHaveAttribute("transform", "translate(64 0) scale(-1 1)");
      expect(discs[waxingIndex].querySelector("g")).not.toHaveAttribute("transform");
    }
  });

  it("accepts provider separators without guessing unknown phases", () => {
    const { rerender } = render(<MoonPhaseDisc phase="waning_crescent" />);
    expect(screen.getByRole("img", { name: "waning_crescent phase illustration" })).toBeInTheDocument();
    rerender(<MoonPhaseDisc phase="Provider phase 99" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("No phase illustration")).toBeInTheDocument();
  });
});
