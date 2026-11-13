import * as yup from "yup";
import { MOOD_IMPACT_TOPICS } from "@/features/mood/impactTopics";

export const moodEntrySchema = yup.object({
  date: yup.string().required("Date is required"),
  moods: yup
    .array()
    .of(yup.string())
    .min(1, "Select at least one mood")
    .required(),
  comment: yup.string().optional(),
  impactTopics: yup.array().of(yup.string().oneOf([...MOOD_IMPACT_TOPICS])).max(MOOD_IMPACT_TOPICS.length).required(),
});
