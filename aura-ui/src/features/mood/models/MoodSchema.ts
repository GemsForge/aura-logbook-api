import * as yup from "yup";

export const moodEntrySchema = yup.object({
  date: yup.string().required("Date is required"),
  moods: yup
    .array()
    .of(yup.string())
    .min(1, "Select at least one mood")
    .required(),
  comment: yup.string().optional(),
});
