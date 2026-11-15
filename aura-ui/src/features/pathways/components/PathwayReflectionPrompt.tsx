import { useEffect, useState } from "react";
import { Box, Button, Textarea, Typography } from "@mui/joy";
import EditNoteOutlined from "@mui/icons-material/EditNoteOutlined";
import { localActivityDate, PathwayActivityApi, type PathwayKey } from "../pathwayActivityApi";

/** Keeps optional writing behind an explicit disclosure; drafts are saved only by the journal action. */
export function PathwayReflectionPrompt({ pathway, moduleKey, insightType, prompt }: {
  pathway: PathwayKey;
  moduleKey: string;
  insightType: string;
  prompt: string;
}) {
  const [responseText, setResponseText] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setResponseText("");
    setMessage("");
  }, [pathway, moduleKey, insightType, prompt]);

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

  return <Box component="details" sx={{ mt: 1.25, maxWidth: 560, "& summary": { display: "flex", alignItems: "center", gap: .75, cursor: "pointer", minHeight: 44, color: "var(--al-theme-primary)", fontSize: "var(--joy-fontSize-sm)", "&:focus-visible": { outline: "2px solid var(--al-theme-focus)", outlineOffset: 2 } } }}>
    <Box component="summary"><EditNoteOutlined aria-hidden="true" sx={{ fontSize: 20 }} />Add a reflection</Box>
    <Box sx={{ pt: .5 }}>
    <Typography level="body-sm">{prompt}</Typography>
    <Textarea aria-label="Your reflection" value={responseText} minRows={2} maxRows={6} slotProps={{ textarea: { maxLength: 2000 } }}
      onChange={(event) => setResponseText(event.target.value)} sx={{ mt: .5 }} />
    <Button size="sm" variant="plain" disabled={saving || !responseText.trim()} onClick={() => void save()} sx={{ mt: .25, px: .5, minHeight: 44 }}>
      Save to journal
    </Button>
    {message && <Typography role="status" level="body-xs" sx={{ mt: .25 }}>{message}</Typography>}
    </Box>
  </Box>;
}
