import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
    expect(screen.getByRole("heading", { level: 2, name: "Birth chart" })).toBeInTheDocument();
    expect(screen.getByText("0° · House 1")).toBeInTheDocument();
    expect(screen.getByText("Taurus")).toBeInTheDocument();
    expect(screen.getByText(/Chart provider · A symbolic reference/)).toBeInTheDocument();
    expect(screen.queryByText("Gemini")).not.toBeInTheDocument();
    expect(screen.queryByText("private raw value")).not.toBeInTheDocument();
    expect(screen.getByText("Optional chart reflection")).toBeInTheDocument();
  });
});
