import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/testUtilities";
import BreathingTimer from "../pathways/BreathingTimer";

/** #386: the shared breathing guide follows its cadence and can be paused, resumed, or reset. */
describe("BreathingTimer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const tick = (seconds: number) => act(() => { vi.advanceTimersByTime(seconds * 1000); });
  const orb = () => screen.getByRole("img");

  it("starts ready and follows the default 4 in / 6 out cadence", () => {
    renderWithProviders(<BreathingTimer />);
    expect(orb()).toHaveAccessibleName("Ready");

    fireEvent.click(screen.getByRole("button", { name: "Start breathing" }));
    expect(orb()).toHaveAccessibleName("Inhale, 4 seconds");
    tick(3);
    expect(orb()).toHaveAccessibleName("Inhale, 1 seconds");
    tick(1);
    expect(orb()).toHaveAccessibleName("Exhale, 6 seconds");
    tick(6);
    expect(orb()).toHaveAccessibleName("Inhale, 4 seconds");
  });

  it("pauses, resumes, and resets", () => {
    renderWithProviders(<BreathingTimer />);
    fireEvent.click(screen.getByRole("button", { name: "Start breathing" }));
    tick(2);

    fireEvent.click(screen.getByRole("button", { name: "Pause breathing" }));
    tick(5);
    expect(screen.getByRole("button", { name: "Resume breathing" })).toBeInTheDocument();
    expect(orb()).toHaveAccessibleName("Paused");

    fireEvent.click(screen.getByRole("button", { name: "Resume breathing" }));
    expect(orb()).toHaveAccessibleName("Inhale, 2 seconds");

    fireEvent.click(screen.getByRole("button", { name: "Reset breathing" }));
    expect(orb()).toHaveAccessibleName("Ready");
    expect(screen.getByRole("button", { name: "Start breathing" })).toBeInTheDocument();
  });

  it("offers an even 3/3 cadence", () => {
    renderWithProviders(<BreathingTimer />);
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Breathing cadence" }));
    fireEvent.click(screen.getByRole("option", { name: "3 in · 3 out" }));

    fireEvent.click(screen.getByRole("button", { name: "Start breathing" }));
    expect(orb()).toHaveAccessibleName("Inhale, 3 seconds");
    tick(3);
    expect(orb()).toHaveAccessibleName("Exhale, 3 seconds");
  });

  it("names every control and keeps 44px touch targets", () => {
    renderWithProviders(<BreathingTimer />);
    for (const name of ["Start breathing", "Reset breathing"]) {
      const button = screen.getByRole("button", { name });
      expect(button).toHaveStyle({ minWidth: "44px", minHeight: "44px" });
    }
  });
});
