import { useState } from "react";
import { Box, Button, Textarea, Typography } from "@mui/joy";
import { localActivityDate, PathwayActivityApi, type PathwayKey } from "../pathwayActivityApi";

/** Collects an optional written response and saves it only after an explicit journal action. */
export function PathwayReflectionPrompt({ pathway, moduleKey, insightType, prompt }: {
  pathway: PathwayKey;
  moduleKey: string;
  insightType: string;
  prompt: string;
}) {
  const [responseText, setResponseText] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const save = async () => {
    const response = responseText.trim();
    if (!response) return;
    setSaving(true);
    setMessage("");
    try {
      await PathwayActivityApi.create({
        pathway,
        moduleKey,
        activityType: "pathway-reflection",
        occurredOn: localActivityDate(),
        content: { insightType, prompt, responseText: response },
      });
      setResponseText("");
      setMessage("Saved to your journal.");
    } catch {
      setMessage("Couldn’t save your response. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return <Box sx={{ mt: 1.25, maxWidth: 560 }}>
    <Typography level="body-sm">{prompt}</Typography>
    <Textarea aria-label="Your reflection" value={responseText} minRows={2} maxRows={6} slotProps={{ textarea: { maxLength: 2000 } }}
      onChange={(event) => setResponseText(event.target.value)} sx={{ mt: .5 }} />
    <Button size="sm" variant="plain" disabled={saving || !responseText.trim()} onClick={() => void save()} sx={{ mt: .25, px: .5 }}>
      Save to journal
    </Button>
    {message && <Typography role="status" level="body-xs" sx={{ mt: .25 }}>{message}</Typography>}
  </Box>;
}
