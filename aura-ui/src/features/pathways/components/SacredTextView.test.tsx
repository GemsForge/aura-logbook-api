import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SacredPassage } from "@/store/auraApi";
import { SacredTextView } from "./SacredTextView";

const mocks = vi.hoisted(() => ({
  query: vi.fn(), refetch: vi.fn(), getMine: vi.fn(), create: vi.fn(),
}));

// Deliberately exports no word-of-day hook: this view must never request that former second card.
vi.mock("@/store/auraApi", () => ({ useGetSacredPassageQuery: mocks.query }));
vi.mock("../pathwayActivityApi", () => ({
  localActivityDate: () => "2026-11-13",
  PathwayActivityApi: { getMine: mocks.getMine, create: mocks.create },
}));

const bible: SacredPassage = {
  framework: "christian", reference: "Psalm 23:1", text: "Yahweh is my shepherd: I shall lack nothing.",
  translation: "World English Bible", attribution: "Public domain, via bible-api.com.",
  readingUrl: "https://www.bible.com/search/bible?q=Psalm%2023%3A1",
};
const quran: SacredPassage = {
  framework: "muslim", reference: "Qur’an 94:6", text: "Indeed, with hardship comes ease.",
  translation: "Saheeh International", attribution: "Translation via Quran.com (Quran Foundation).",
  readingUrl: "https://quran.com/94/6",
};
const jewish: SacredPassage = {
  framework: "jewish", reference: "Genesis 1:1", text: "In the beginning God created the heaven and the earth.",
  translation: "JPS 1917", attribution: "Text from Sefaria.", readingUrl: "https://www.sefaria.org/Genesis.1.1",
};

describe("SacredTextView daily reading", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getMine.mockResolvedValue([]);
    mocks.create.mockResolvedValue({ id: 1 });
    mocks.query.mockReturnValue({ currentData: undefined, isLoading: false, isFetching: false, refetch: mocks.refetch });
  });

  it.each([undefined, "neutral", "other", "custom"])("uses one authored quote without source requests or links for %s", async (framework) => {
    render(<SacredTextView framework={framework} />);
    expect(mocks.query).toHaveBeenCalledWith("christian", { skip: true });
    expect(screen.getByRole("heading", { name: "Quote of the day", level: 2 })).toBeInTheDocument();
    expect(screen.getByText("Aura Logbook")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(document.querySelectorAll("blockquote")).toHaveLength(1);
    expect(document.querySelector("h1")).toBeNull();
    await waitFor(() => expect(mocks.getMine).toHaveBeenCalled());
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it.each([
    { reading: bible, heading: "Verse of the day", publisher: "YouVersion Bible App", other: "Quran.com" },
    { reading: quran, heading: "Daily passage", publisher: "Quran.com", other: "Sefaria" },
    { reading: jewish, heading: "Daily passage", publisher: "Sefaria", other: "YouVersion Bible App" },
  ])("shows only $reading.framework content and matching attribution", async ({ reading, heading, publisher, other }) => {
    mocks.query.mockReturnValue({ currentData: reading, isLoading: false });
    render(<SacredTextView framework={reading.framework} />);
    expect(mocks.query).toHaveBeenCalledWith(reading.framework, { skip: false });
    expect(screen.getByRole("heading", { name: heading, level: 2 })).toBeInTheDocument();
    expect(screen.getByText(`“${reading.text}”`)).toBeInTheDocument();
    expect(screen.getByText(reading.attribution)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read passage at source" })).toHaveAttribute("href", reading.readingUrl);
    expect(screen.getByRole("link", { name: `Open ${publisher}` })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: `Open ${other}` })).not.toBeInTheDocument();
    expect(screen.queryByText("Aura Logbook")).not.toBeInTheDocument();
    expect(document.querySelectorAll("blockquote")).toHaveLength(1);
    await waitFor(() => expect(mocks.getMine).toHaveBeenCalled());
  });

  it("hides retained prior-framework data and links while the next framework loads", async () => {
    mocks.query.mockReturnValue({ currentData: bible, data: bible, isLoading: false });
    const { rerender } = render(<SacredTextView framework="christian" />);
    await waitFor(() => expect(mocks.getMine).toHaveBeenCalled());
    mocks.query.mockReturnValue({ data: bible, currentData: undefined, isLoading: false, isFetching: true });
    rerender(<SacredTextView framework="muslim" />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading today’s passage");
    expect(screen.queryByText(`“${bible.text}”`)).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    mocks.query.mockReturnValue({ currentData: quran, isLoading: false });
    rerender(<SacredTextView framework="muslim" />);
    expect(screen.getByText(`“${quran.text}”`)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("link", { name: "Open Quran.com" })).toBeInTheDocument());
    rerender(<SacredTextView />);
    expect(mocks.query).toHaveBeenLastCalledWith("christian", { skip: true });
    expect(screen.queryByText(`“${quran.text}”`)).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it.each([null, { ...bible, text: " " }, quran])("does not replace an empty or mismatched provider result with a different reading", (currentData) => {
    mocks.query.mockReturnValue({ currentData, isError: true, refetch: mocks.refetch });
    render(<SacredTextView framework="christian" />);
    expect(screen.getByRole("status")).toHaveTextContent("unavailable");
    expect(screen.queryByRole("blockquote")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(mocks.refetch).toHaveBeenCalledOnce();
  });

  it("keeps reflection drafts unsaved until Save to journal and scopes feedback to daily faith readings", async () => {
    mocks.query.mockReturnValue({ currentData: bible, isLoading: false });
    render(<SacredTextView framework="christian" />);
    await waitFor(() => expect(mocks.getMine).toHaveBeenCalled());
    fireEvent.change(screen.getByRole("textbox", { name: "Your reflection" }), { target: { value: "A private thought." } });
    expect(mocks.create).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Save to journal" }));
    await screen.findByText("Saved to your journal.");
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      pathway: "faith", moduleKey: "sacred-texts", activityType: "pathway-reflection",
      content: { insightType: "word-of-day", prompt: "As you read Psalm 23:1, what stands out to you?", responseText: "A private thought." },
    }));
    fireEvent.click(screen.getByRole("button", { name: "Maybe" }));
    await screen.findByText("Saved. This feedback only guides matching insights.");
    expect(mocks.create).toHaveBeenLastCalledWith(expect.objectContaining({
      pathway: "faith", moduleKey: "sacred-texts", activityType: "insight-feedback",
      content: { insightType: "word-of-day", response: "maybe" },
    }));
  });
});
