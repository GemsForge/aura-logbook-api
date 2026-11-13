import { useEffect, useState } from "react";
import { Box, Button, FormControl, FormLabel, Input, Option, Select, Typography } from "@mui/joy";
import { localActivityDate, PathwayActivityApi, type PathwayActivity } from "../pathwayActivityApi";

const practices = ["Breath awareness", "Observe", "Describe", "Participate", "Mindful walk", "Other"];

/** Reusable private practice logger without scores, streaks, or required written notes. */
export function MindfulPracticeLog() {
  const [practice, setPractice] = useState<string | null>(practices[0]);
  const [duration, setDuration] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<PathwayActivity[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { setItems(await PathwayActivityApi.getMine({ pathway: "mindfulness", moduleKey: "practice-log", activityType: "mindful-practice" })); }
    catch { setMessage("Your practice log isn’t available right now."); }
  };
  useEffect(() => { void load(); }, []);

  const save = async () => {
    if (!practice) return;
    setSaving(true);
    try {
      await PathwayActivityApi.create({
        pathway: "mindfulness", moduleKey: "practice-log", activityType: "mindful-practice",
        occurredOn: localActivityDate(),
        content: { practice, ...(duration ? { durationMinutes: Number(duration) } : {}), ...(note.trim() ? { note: note.trim() } : {}) },
      });
      setDuration(""); setNote(""); setMessage("Practice saved."); await load();
    } catch { setMessage("Couldn’t save your practice. Check the details and try again."); }
    finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    try { await PathwayActivityApi.remove(id); await load(); }
    catch { setMessage("Couldn’t delete this practice yet."); }
  };

  return <Box sx={{ display: "grid", gap: 1.25, mt: 1 }}>
    <Typography level="body-sm" color="neutral">Log what you tried. No scores or streaks.</Typography>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 140px" }, gap: 1 }}>
      <FormControl><FormLabel>Practice</FormLabel><Select value={practice} onChange={(_, value) => setPractice(value)}>{practices.map((item) => <Option key={item} value={item}>{item}</Option>)}</Select></FormControl>
      <FormControl><FormLabel>Minutes (optional)</FormLabel><Input type="number" value={duration} slotProps={{ input: { min: 1, max: 1440 } }} onChange={(event) => setDuration(event.target.value)} /></FormControl>
    </Box>
    <FormControl><FormLabel>Note (optional)</FormLabel><Input value={note} onChange={(event) => setNote(event.target.value)} /></FormControl>
    <Button size="sm" disabled={!practice || saving || (duration !== "" && (!Number.isInteger(Number(duration)) || Number(duration) < 1 || Number(duration) > 1440))} onClick={() => void save()} sx={{ justifySelf: "start" }}>Save practice</Button>
    {message && <Typography role="status" level="body-xs">{message}</Typography>}
    {items.length > 0 ? <Box component="ul" aria-label="Saved practices" sx={{ m: 0, p: 0, listStyle: "none", display: "grid", gap: .5 }}>
      {items.map((item) => <Box component="li" key={item.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, py: .5 }}>
        <Typography level="body-sm">{item.occurredOn} · {"practice" in item.content ? item.content.practice : "Practice"}{"durationMinutes" in item.content && item.content.durationMinutes ? ` · ${item.content.durationMinutes} min` : ""}</Typography>
        <Button size="sm" variant="plain" color="neutral" onClick={() => void remove(item.id)}>Delete</Button>
      </Box>)}
    </Box> : <Typography level="body-xs" color="neutral">No practices logged yet.</Typography>}
  </Box>;
}
