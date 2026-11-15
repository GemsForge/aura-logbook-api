import * as yup from "yup";
import dayjs from "dayjs";
import { parseMoodOccurrence } from "@/features/mood/moodOccurrenceTime";
import { MOOD_IMPACT_TOPICS } from "@/features/mood/impactTopics";

/** Validates a local journal date independently of the API's UTC creation timestamp. */
export const moodEntrySchema = yup.object({
  date: yup.string().required("Date is required")
    .test("calendar-date", "Choose a valid date", (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value) && dayjs(value).isValid() && dayjs(value).format("YYYY-MM-DD") === value)
    .test("not-future", "Date cannot be in the future", function (value) {
      const occurrence = parseMoodOccurrence(this.parent.occurredAt);
      const today = occurrence ? dayjs().utcOffset(occurrence.utcOffset() / 60).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");
      return !value || value <= today;
    }),
  occurredAt: yup.string().optional()
    .test("occurrence-time", "Choose a valid date and time", (value) => value === undefined || Boolean(parseMoodOccurrence(value)))
    .test("not-future-time", "Date and time cannot be in the future", (value) => !value || !parseMoodOccurrence(value) || parseMoodOccurrence(value)!.valueOf() <= Date.now())
    .test("local-day", "Date and time must match the journal date", function (value) {
      const moment = parseMoodOccurrence(value);
      return !moment || moment.format("YYYY-MM-DD") === this.parent.date;
    }),
  moods: yup
    .array()
    .of(yup.string())
    .min(1, "Select at least one mood")
    .required(),
  comment: yup.string().optional(),
  impactTopics: yup.array().of(yup.string().oneOf([...MOOD_IMPACT_TOPICS])).max(MOOD_IMPACT_TOPICS.length).required(),
});
