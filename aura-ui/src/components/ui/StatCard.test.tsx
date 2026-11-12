import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StatCard from "./StatCard";

/** StatCard keeps a caption line even when empty, so cards in a row match heights. */
describe("StatCard", () => {
  it("renders label, value, unit, and caption", () => {
    render(<StatCard label="Average energy" value="3.4" unit="/ 5" caption="+0.3 vs last week" />);
    expect(screen.getByText("Average energy")).toBeInTheDocument();
    expect(screen.getByText("3.4")).toBeInTheDocument();
    expect(screen.getByText("/ 5")).toBeInTheDocument();
    expect(screen.getByText("+0.3 vs last week")).toBeInTheDocument();
  });

  it("reserves a hidden caption line when no caption is given", () => {
    const { container } = render(<StatCard label="Streak" value="1 day" />);
    const reserved = container.querySelector('[aria-hidden="true"]');
    expect(reserved?.textContent).toBe(" ");
  });
});
