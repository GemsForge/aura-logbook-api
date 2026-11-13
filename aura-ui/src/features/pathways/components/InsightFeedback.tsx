import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Box, Button, Typography } from "@mui/joy";
import { localActivityDate, PathwayActivityApi, type InsightFeedbackValue, type PathwayKey } from "../pathwayActivityApi";

const options: Array<{ value: InsightFeedbackValue; label: string }> = [
  { value: "resonates", label: "Resonates" },
  { value: "maybe", label: "Maybe" },
  { value: "not-for-me", label: "Not for me" },
];

/** Saves feedback per insight type and can hide its supplied content when the user rejects that lens. */
export function InsightFeedback({ pathway, moduleKey, insightType, children, hideContentWhenNotForMe = false }: { pathway: PathwayKey; moduleKey: string; insightType: string; children?: ReactNode; hideContentWhenNotForMe?: boolean }) {
  const [selected, setSelected] = useState<InsightFeedbackValue | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    void PathwayActivityApi.getMine({ pathway, moduleKey, activityType: "insight-feedback" })
      .then((items) => {
        const latest = items.find((item) => item.content && "insightType" in item.content && item.content.insightType === insightType);
        if (mounted && latest && "response" in latest.content) setSelected(latest.content.response);
      })
      .catch(() => { if (mounted) setMessage("Feedback isn’t available right now."); });
    return () => { mounted = false; };
  }, [pathway, moduleKey, insightType]);

  const save = async (response: InsightFeedbackValue) => {
    setSaving(true);
    setMessage("");
    try {
      await PathwayActivityApi.create({
        pathway, moduleKey, activityType: "insight-feedback", occurredOn: localActivityDate(),
        content: { insightType, response },
      });
      setSelected(response);
      setMessage("Saved. This feedback only guides matching insights.");
    } catch {
      setMessage("Couldn’t save your response. Try again.");
    } finally { setSaving(false); }
  };

  return <Box sx={{ mt: 1.5 }}>
    {!(hideContentWhenNotForMe && selected === "not-for-me") && children}
    <Typography level="body-xs" color="neutral">Does this feel meaningful?</Typography>
    <Box role="group" aria-label="Insight feedback" sx={{ display: "flex", flexWrap: "wrap", gap: .5, mt: .5 }}>
      {options.map((option) => <Button key={option.value} size="sm" variant={selected === option.value ? "solid" : "plain"} disabled={saving} onClick={() => void save(option.value)}>{option.label}</Button>)}
    </Box>
    {message && <Typography role="status" level="body-xs" sx={{ mt: .5 }}>{message}</Typography>}
  </Box>;
}
