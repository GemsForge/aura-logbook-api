import dayjs, { type Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import type { MoodEntry } from "./models/schema/MoodEntry";

dayjs.extend(utc);

/** ISO occurrence format retains the chosen wall-clock time and explicit offset, rather than converting its date to UTC. */
export const MOOD_OCCURRENCE_FORMAT = "YYYY-MM-DDTHH:mm:ssZ";

/** Reads a saved occurrence at its recorded offset, so travelling does not relabel its hour-of-day metrics. */
export function parseMoodOccurrence(value?: string | null): Dayjs | null {
  if (!value) return null;
  const parsed = dayjs(value);
  const offset = value.match(/(Z|([+-])(\d{2}):(\d{2}))$/);
  if (!parsed.isValid() || !offset) return null;
  const minutes = offset[1] === "Z" ? 0 : (Number(offset[3]) * 60 + Number(offset[4])) * (offset[2] === "-" ? -1 : 1);
  // Dayjs treats offsets up to 16 as hours, so supply hours consistently even for small minute offsets.
  return parsed.utcOffset(minutes / 60);
}

/** Uses an explicitly recorded occurrence time; older entries retain their existing creation-time fallback. */
export function moodOccurrenceTime(entry: MoodEntry): Dayjs {
  return parseMoodOccurrence(entry.occurredAt) ?? (entry.createdAt && dayjs(entry.createdAt).isValid() ? dayjs(entry.createdAt) : dayjs(entry.date).hour(12));
}

/** An edit control may show a legacy clock fallback on the journal day without silently saving an invented occurrence time. */
export function editableMoodOccurrence(entry: MoodEntry): Dayjs {
  const saved = parseMoodOccurrence(entry.occurredAt);
  if (saved) return saved;
  const time = moodOccurrenceTime(entry);
  return dayjs(entry.date).hour(time.hour()).minute(time.minute()).second(0).millisecond(0);
}

/** Orders journal days, then actual occurrence instants; stable IDs settle ties without changing day buckets. */
export function compareMoodOccurrence(left: MoodEntry, right: MoodEntry): number {
  return left.date.localeCompare(right.date) || moodOccurrenceTime(left).valueOf() - moodOccurrenceTime(right).valueOf() || left.id - right.id;
}
