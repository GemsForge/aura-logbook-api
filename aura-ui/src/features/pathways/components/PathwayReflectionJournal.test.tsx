import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { PathwayReflectionJournal } from "./PathwayReflectionJournal";

const mocks = vi.hoisted(() => ({ getMine: vi.fn() }));
vi.mock("../pathwayActivityApi", () => ({ PathwayActivityApi: { getMine: mocks.getMine, update: vi.fn(), remove: vi.fn() } }));

/** Reader reflections link back to the verse they were written on; other reflections do not. */
describe("PathwayReflectionJournal", () => {
  it("links a sacred-text reader reflection to its passage", async () => {
    mocks.getMine.mockResolvedValue([
      { id: 1, pathway: "faith", moduleKey: "sacred-texts", activityType: "pathway-reflection", occurredOn: "2026-11-15",
        content: { insightType: "reader-reflection", prompt: "As you read Proverbs 3, what stands out to you?", responseText: "Trust.", reference: "Proverbs 3", segment: "Proverbs 3:5" } },
      { id: 2, pathway: "mindfulness", moduleKey: "mindfulness-guide", activityType: "pathway-reflection", occurredOn: "2026-11-15",
        content: { insightType: "mindfulness-concept", prompt: "Notice.", responseText: "Calm." } },
    ]);
    render(<MemoryRouter><PathwayReflectionJournal /></MemoryRouter>);
    const link = await screen.findByRole("link", { name: "Open Proverbs 3:5" });
    expect(link.getAttribute("href")).toBe("/pathways/sacred-texts/reader?reference=Proverbs+3&segment=Proverbs+3%3A5");
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});
