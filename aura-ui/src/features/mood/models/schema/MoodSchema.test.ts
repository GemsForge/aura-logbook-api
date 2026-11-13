import dayjs from "dayjs";
import { describe, expect, it, vi } from "vitest";
import { moodEntrySchema } from "./MoodSchema";

/** Journal dates are local calendar choices; this validation never changes server creation timestamps. */
describe("mood journal date validation", () => {
  const validateDate = (date: string) => moodEntrySchema.validateAt("date", { date });

  it("accepts today and a valid past date unchanged", async () => {
    const today = dayjs().format("YYYY-MM-DD");
    const past = dayjs().subtract(7, "day").format("YYYY-MM-DD");
    await expect(validateDate(today)).resolves.toBe(today);
    await expect(validateDate(past)).resolves.toBe(past);
  });

  it("rejects future dates instead of silently submitting today", async () => {
    await expect(validateDate(dayjs().add(1, "day").format("YYYY-MM-DD"))).rejects.toThrow("Date cannot be in the future");
  });

  it.each(["2026-02-30", "not-a-date", "2026-1-3"])("rejects an invalid or non-canonical date: %s", async (date) => {
    await expect(validateDate(date)).rejects.toThrow("Choose a valid date");
  });

  it("accepts a chosen occurrence at its local day even across UTC date boundaries", async () => {
    await expect(moodEntrySchema.validateAt("occurredAt", { date: "1998-01-01", occurredAt: "1998-01-01T23:30:00-08:00" })).resolves.toBe("1998-01-01T23:30:00-08:00");
    await expect(moodEntrySchema.validateAt("occurredAt", { date: "1998-01-02", occurredAt: "1998-01-01T23:30:00-08:00" })).rejects.toThrow("Date and time must match the journal date");
  });

  it("rejects a future occurrence clock while allowing omitted legacy times", async () => {
    const future = dayjs().add(1, "hour");
    await expect(moodEntrySchema.validateAt("occurredAt", { date: future.format("YYYY-MM-DD"), occurredAt: future.format("YYYY-MM-DDTHH:mm:ssZ") })).rejects.toThrow("Date and time cannot be in the future");
    await expect(moodEntrySchema.validateAt("occurredAt", { date: "1998-01-01" })).resolves.toBeUndefined();
  });

  it("compares the local journal day in the submitted offset rather than the browser timezone", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-13T20:00:00Z"));
    try {
      const value = { date: "2026-11-14", occurredAt: "2026-11-14T09:00:00+14:00" };
      await expect(moodEntrySchema.validateAt("date", value)).resolves.toBe("2026-11-14");
      await expect(moodEntrySchema.validateAt("occurredAt", value)).resolves.toBe(value.occurredAt);
    } finally { vi.useRealTimers(); }
  });

  it("requires a journal date", async () => {
    await expect(validateDate("")).rejects.toThrow("Date is required");
  });
});
