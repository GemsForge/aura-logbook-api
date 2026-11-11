import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import AuraSeasonCard from "./AuraSeasonCard";

const query = vi.hoisted(() => ({
  result: { data: undefined as unknown, isLoading: true, isError: false, refetch: vi.fn() },
}));

vi.mock("@/store/auraApi", () => ({ useGetAuraSeasonsQuery: () => query.result }));

describe("AuraSeasonCard", () => {
  beforeEach(() => {
    query.result = { data: undefined, isLoading: true, isError: false, refetch: vi.fn() };
  });

  it("announces loading while the season request is pending", () => {
    render(<AuraSeasonCard />);
    expect(screen.getByRole("status")).toHaveTextContent("Checking for a season pattern");
  });

  it("explains the shifting state when no season has held", () => {
    query.result = { data: { current: null, history: [] }, isLoading: false, isError: false, refetch: vi.fn() };
    render(<AuraSeasonCard />);
    expect(screen.getByRole("heading", { name: "Your aura is shifting…" })).toBeInTheDocument();
    expect(screen.getByText(/A season may emerge/)).toBeInTheDocument();
  });

  it("shows the pathway reflection and next step for a held season", () => {
    query.result = { data: { current: { key: "tide", name: "Steady Tide", oftenLinkedWith: "calm, consistency, trust", prompt: "What has been helping you stay steady?", nextStep: "Keep one small ritual that's working." }, history: [] }, isLoading: false, isError: false, refetch: vi.fn() };
    render(<AuraSeasonCard />);
    expect(screen.getByRole("heading", { name: "Steady Tide" })).toBeInTheDocument();
    expect(screen.getByText("What has been helping you stay steady?")).toBeInTheDocument();
    expect(screen.getByText(/Keep one small ritual/)).toBeInTheDocument();
  });

  it("offers a retry when the season request fails", () => {
    query.result = { data: undefined, isLoading: false, isError: true, refetch: vi.fn() };
    render(<AuraSeasonCard />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(query.result.refetch).toHaveBeenCalledOnce();
  });
});
