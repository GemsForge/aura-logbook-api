import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import type { MoodEntry } from "./models/schema/MoodEntry";
import { compareMoodOccurrence, editableMoodOccurrence, moodOccurrenceTime, parseMoodOccurrence } from "./moodOccurrenceTime";

const entry: MoodEntry = { id: 1, userId: 1, date: "1998-01-01", moods: ["Centered"], createdAt: "2026-11-13T12:00:00Z" };

/** Original offsets determine displayed occurrence clocks; CreatedAt remains the legacy audit fallback. */
describe("mood occurrence time", () => {
  it.each(["1998-01-01T23:30:00-08:00", "1998-01-02T00:30:00+14:00", "1998-01-01T08:00:00+00:15"])("retains the recorded local date and offset for %s", (value) => {
    expect(parseMoodOccurrence(value)?.format("YYYY-MM-DDTHH:mm:ssZ")).toBe(value);
  });
  it("uses occurrence time even when the entry was saved much later", () => {
    expect(moodOccurrenceTime({ ...entry, occurredAt: "1998-01-01T17:45:00+05:30" }).format("h:mm A")).toBe("5:45 PM");
    expect(moodOccurrenceTime(entry).valueOf()).toBe(dayjs(entry.createdAt).valueOf());
    expect(moodOccurrenceTime({ ...entry, occurredAt: "invalid" }).valueOf()).toBe(dayjs(entry.createdAt).valueOf());
  });
  it("orders moments by occurrence rather than save order", () => {
    const late = { ...entry, id: 2, occurredAt: "1998-01-01T18:00:00-05:00", createdAt: "2026-11-12T12:00:00Z" };
    const early = { ...entry, occurredAt: "1998-01-01T08:00:00-05:00" };
    expect([late, early].sort(compareMoodOccurrence).map((item) => item.id)).toEqual([1, 2]);
  });
  it("offers a legacy edit fallback on its journal date without mutating the entry", () => {
    expect(editableMoodOccurrence(entry).format("YYYY-MM-DD")).toBe(entry.date);
    expect(entry.occurredAt).toBeUndefined();
  });
});
