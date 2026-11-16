import { act, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDailyHoroscope, getMoonCycle } from "../astrologyApi";
import { MoonPhaseMoodInsights } from "./MoonPhaseMoodInsights";

const mocks = vi.hoisted(() => ({
  user: { birthday: "1990-03-21", pathwayPreferences: { saveBirthDetails: false } } as { birthday?: string; pathwayPreferences: { saveBirthDetails: boolean; birthTime?: string; birthPlace?: string } },
  logMood: vi.fn(),
  dispatch: vi.fn(),
}));

vi.mock("../astrologyApi", () => ({ getMoonCycle: vi.fn(), getDailyHoroscope: vi.fn() }));
vi.mock("@/store/hooks", () => ({ useAppSelector: () => mocks.user, useAppDispatch: () => mocks.dispatch }));
vi.mock("@/store/slices/authSlice", () => ({ selectCurrentUser: vi.fn() }));
vi.mock("@/store/slices/uiSlice", () => ({ openProfileModal: vi.fn() }));
vi.mock("@/store/auraApi", () => ({ useGetZodiacInsightQuery: () => ({ data: { sign: "Aries", element: "Fire", description: "A reference description." }, isLoading: false }) }));
vi.mock("@/store/referenceDataApi", () => ({ useGetReferenceDataQuery: () => ({ data: {
  moods: [{ key: "Centered", displayName: "Centered", icon: "sun", auraColorKeys: ["calm"] }],
  auras: [{ key: "calm", baseHex: "#668877", shades: { 500: "#668877" }, sortOrder: 1 }],
  zodiacSigns: [{ key: "Aries", description: "A reference description." }],
} }) }));
vi.mock("@/store/moodApi", () => ({ useLogMoodMutation: () => [mocks.logMood] }));
vi.mock("./InsightFeedback", () => ({ InsightFeedback: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("./PathwayReflectionPrompt", () => ({ PathwayReflectionPrompt: () => <div>Optional reflection</div> }));

const today = new Date();
const dateFor = (offset: number) => {
  const date = new Date(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}T12:00:00`);
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

describe("daily astrology date path", () => {
  beforeEach(() => {
    mocks.user = { birthday: "1990-03-21", pathwayPreferences: { saveBirthDetails: false } };
    mocks.logMood.mockReset().mockReturnValue({ unwrap: () => Promise.resolve({ id: 1 }) });
    vi.mocked(getDailyHoroscope).mockReset().mockResolvedValue({ sign: "aries", date: dateFor(0), text: "A steady day.", provider: "Test" });
    vi.mocked(getMoonCycle).mockReset().mockResolvedValue({ startDate: dateFor(-29), endDate: dateFor(0), days: [
      { date: dateFor(-1), phase: "Waning Crescent", illumination: 0.1, moonSign: "Pisces", entryCount: 1, moodCounts: { Tired: 1 } },
      { date: dateFor(0), phase: "Waxing Gibbous", illumination: 0.75, moonSign: "Aries", entryCount: 2, moodCounts: { Centered: 2 } },
    ] });
  });

  it("opens on today and keeps each chosen date connected to moon and mood counts", async () => {
    render(<MoonPhaseMoodInsights />);
    const todayButton = await screen.findByRole("button", { name: new RegExp(`${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(`${dateFor(0)}T12:00:00`))}.*Waxing Gibbous.*2 moods logged`) });
    expect(todayButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/75% illuminated · Moon in Aries/)).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: /In your chart/ })[0]);
    expect(screen.getByText(/Birth time and place are optional/)).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: /Your pattern/ })[0]);
    expect(screen.getByText(/Moods logged during Waxing Gibbous on/)).toBeInTheDocument();
    expect(screen.getByText("Centered · 2")).toBeInTheDocument();
    expect(screen.getByText(/not evidence that the moon caused a mood/)).toBeInTheDocument();

    const priorDay = screen.getByRole("button", { name: /Waning Crescent.*1 mood logged/ });
    await userEvent.click(priorDay);
    expect(priorDay).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getAllByRole("button", { name: /Your pattern/ })[0]);
    expect(screen.getByText(/Moods logged during Waning Crescent on/)).toBeInTheDocument();
    expect(screen.getByText("Tired · 1")).toBeInTheDocument();
  });

  it("moves keyboard focus between date buttons with arrow keys and saves only on mood activation", async () => {
    const user = userEvent.setup();
    render(<MoonPhaseMoodInsights />);
    const priorDay = await screen.findByRole("button", { name: /Waning Crescent.*1 mood logged/ });
    act(() => priorDay.focus());
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toHaveAccessibleName(/Waxing Gibbous.*2 moods logged/);
    await user.keyboard("{Enter}");
    expect(mocks.logMood).not.toHaveBeenCalled();
    await user.click(screen.getAllByRole("button", { name: /Your pattern/ })[0]);
    await user.click(screen.getByRole("button", { name: "Centered" }));
    await waitFor(() => expect(mocks.logMood).toHaveBeenCalledWith({ date: dateFor(0), moods: ["Centered"] }));
  });

  it("skips the chart step and offers a birthday invitation when none is saved", async () => {
    mocks.user = { pathwayPreferences: { saveBirthDetails: false } };
    vi.mocked(getMoonCycle).mockResolvedValue({ startDate: dateFor(0), endDate: dateFor(0), days: [{ date: dateFor(0), phase: null, illumination: null, moonSign: null, entryCount: 0, moodCounts: {} }] });
    render(<MoonPhaseMoodInsights />);
    expect(await screen.findByText("Add a birthday for your optional sun-sign horoscope.")).toBeInTheDocument();
    expect(screen.getAllByRole("group", { name: /Today's sky, step 1 of 2/ })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /In your chart/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Moon details aren’t available for this day/)).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: /Your pattern/ })[0]);
    expect(screen.getByText("No moods logged for this day yet. Choose a mood below to log it.")).toBeInTheDocument();
  });

  it("keeps the moon visible and offers a retry when the horoscope provider is unavailable", async () => {
    vi.mocked(getDailyHoroscope).mockRejectedValueOnce(new Error("provider down")).mockResolvedValueOnce({ sign: "aries", date: dateFor(0), text: "Available again.", provider: "Test" });
    render(<MoonPhaseMoodInsights />);
    expect(await screen.findByText("Today’s reading isn’t available right now.")).toBeInTheDocument();
    expect(screen.getByText("Waxing Gibbous")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Available again.")).toBeInTheDocument();
  });
});
