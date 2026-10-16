import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import MoodTimelineChart from "./MoodTimeLineChart";
import { renderWithProviders } from "../../test/testUtilities";

vi.mock("recharts", () => ({
  LineChart: ({ data, children }: { data: unknown[]; children: ReactNode }) => (
    <section>
      <output data-testid="timeline-data">{JSON.stringify(data)}</output>
      {children}
    </section>
  ),
  Line: ({ dataKey }: { dataKey: string }) => (
    <output data-testid="line-data-key">{dataKey}</output>
  ),
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe("MoodTimelineChart", () => {
  it("shows its title and passes dated counts to the line chart", () => {
    const data = [
      { date: "2026-10-14", count: 2 },
      { date: "2026-10-15", count: 4 },
    ];
    renderWithProviders(<MoodTimelineChart data={data} />);

    expect(screen.getByText("Mood Entry Timeline")).toBeInTheDocument();
    expect(JSON.parse(screen.getByTestId("timeline-data").textContent ?? "[]")).toEqual(data);
    expect(screen.getByTestId("line-data-key")).toHaveTextContent("count");
  });
});
