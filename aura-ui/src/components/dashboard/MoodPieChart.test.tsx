import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import MoodPieChart from "./MoodPieChart";
import { renderWithProviders } from "../../test/testUtilities";

vi.mock("recharts", () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ data }: { data: unknown[] }) => (
    <output data-testid="pie-data">{JSON.stringify(data)}</output>
  ),
  Cell: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("MoodPieChart", () => {
  it("shows the breakdown and charts the five highest percentage moods", () => {
    renderWithProviders(
      <MoodPieChart
        data={[
          { mood: "Empowered", percent: 40 },
          { mood: "Centered", percent: 25 },
          { mood: "Harmonious", percent: 15 },
          { mood: "Flowing", percent: 10 },
          { mood: "Weary", percent: 7 },
          { mood: "Tense", percent: 3 },
          { mood: "Blocked", count: 100 },
        ]}
      />
    );

    expect(screen.getByText("Mood Breakdown")).toBeInTheDocument();
    expect(JSON.parse(screen.getByTestId("pie-data").textContent ?? "[]")).toEqual([
      { mood: "Empowered", percent: 40 },
      { mood: "Centered", percent: 25 },
      { mood: "Harmonious", percent: 15 },
      { mood: "Flowing", percent: 10 },
      { mood: "Weary", percent: 7 },
    ]);
  });
});
