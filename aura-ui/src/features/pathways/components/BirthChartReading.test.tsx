import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { getNatalChart } from "../astrologyApi";
import { BirthChartReading } from "./BirthChartReading";

vi.mock("../astrologyApi", () => ({ getNatalChart: vi.fn() }));
vi.mock("./InsightFeedback", () => ({ InsightFeedback: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("./PathwayReflectionPrompt", () => ({ PathwayReflectionPrompt: () => <div>Optional chart reflection</div> }));

describe("birth chart placement presentation", () => {
  beforeEach(() => { vi.mocked(getNatalChart).mockReset(); });

  it("does not fetch before birth-detail saving enables the chart", () => {
    const { container } = render(<BirthChartReading enabled={false} />);
    expect(getNatalChart).not.toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
  });

  it("keeps recognized provider fields, zero-degree metadata, and source attribution", async () => {
    vi.mocked(getNatalChart).mockResolvedValue({ provider: "Chart provider", retrievedAt: "2026-11-13", chart: { placements: [{ name: "Sun", sign: "Aries", degree: 0, house: 1 }, { planet: "Moon", zodiac_sign: "Taurus" }, { name: "Unrecognized", sign: "Gemini" }], internal: "private raw value" } });
    render(<BirthChartReading enabled />);
    expect(await screen.findByText("Aries")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Your saved birth placements" })).toBeInTheDocument();
    expect(screen.getByText("0° · House 1")).toBeInTheDocument();
    expect(screen.getByText("Taurus")).toBeInTheDocument();
    expect(screen.getByText(/Chart provider · A symbolic reference/)).toBeInTheDocument();
    expect(screen.queryByText("Gemini")).not.toBeInTheDocument();
    expect(screen.queryByText("private raw value")).not.toBeInTheDocument();
    expect(screen.getByText("Optional chart reflection")).toBeInTheDocument();
  });

  it("highlights only placements whose sign exactly matches the selected day's Moon sign", async () => {
    vi.mocked(getNatalChart).mockResolvedValue({ provider: "Chart provider", retrievedAt: "2026-11-13", chart: { placements: [{ name: "Sun", sign: "Aries" }, { name: "Moon", sign: "Taurus" }] } });
    render(<BirthChartReading enabled selectedMoonSign="Taurus" />);
    const sun = await screen.findByRole("button", { name: /Sun Aries/ });
    const moon = screen.getByRole("button", { name: /Moon Taurus/ });
    expect(sun).not.toHaveAttribute("aria-describedby", "moon-chart-match");
    expect(moon).toHaveAttribute("aria-describedby", "moon-chart-match");
    expect(screen.getByText("The selected day’s Moon in Taurus touches your chart.")).toBeInTheDocument();
  });

  it("opens the selected provider placement's lens with the keyboard", async () => {
    vi.mocked(getNatalChart).mockResolvedValue({ provider: "Chart provider", retrievedAt: "2026-11-13", chart: { placements: [{ name: "Sun", sign: "Aries", degree: 0, house: 1 }, { name: "Moon", sign: "Taurus", degree: 12, house: 4 }] } });
    const user = userEvent.setup();
    render(<BirthChartReading enabled />);
    const sun = await screen.findByRole("button", { name: /Sun Aries/ });
    expect(sun).toHaveAttribute("aria-pressed", "true");
    const moon = screen.getByRole("button", { name: /Moon Taurus/ });
    moon.focus();
    await user.keyboard("[Enter]");
    expect(moon).toHaveAttribute("aria-pressed", "true");
    expect(sun).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("heading", { name: "Emotional needs" })).toBeInTheDocument();
    expect(screen.getByText("12° · House 4")).toBeInTheDocument();
    expect(screen.queryByText("0° · House 1")).not.toBeInTheDocument();
  });
});
