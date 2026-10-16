import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import MoodStatCard from "./MoodStatCard";
import { renderWithProviders } from "../../test/testUtilities";

describe("MoodStatCard", () => {
  it("renders the statistic title, emoji, and value", () => {
    renderWithProviders(
      <MoodStatCard title="Current streak" value="5 days" emoji="🔥" />
    );

    expect(screen.getByText("Current streak")).toBeInTheDocument();
    expect(screen.getByText("🔥")).toBeInTheDocument();
    expect(screen.getByText("5 days")).toBeInTheDocument();
  });

  it("renders without an optional emoji", () => {
    renderWithProviders(<MoodStatCard title="Entries" value="12" />);

    expect(screen.getByText("Entries")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });
});
