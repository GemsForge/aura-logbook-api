import { useEffect, useState } from "react";
import { Box, Button, Checkbox, FormControl, FormControlLabel, FormLabel, TextField, Typography } from "@mui/material";
import { localActivityDate, PathwayActivityApi, type PathwayActivity } from "../pathwayActivityApi";

const practiceLabels: Record<string, string> = {
  "sacred-text-reading": "Sacred-text reading",
  prayer: "Prayer or supplication",
  contemplation: "Contemplation",
  "worship-or-gathering": "Worship or gathering",
  gratitude: "Gratitude",
  "service-or-care": "Service or acts of care",
};

/** Records only the faith practices the user chose to answer, with no score or missed-day penalty. */
export function FaithPracticeCheckIn() {
  const [practices, setPractices] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState("");
  const [items, setItems] = useState<PathwayActivity[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { setItems(await PathwayActivityApi.getMine({ pathway: "faith", moduleKey: "faith-practice-check-in", activityType: "faith-practice-check-in" })); }
    catch { setMessage("Your practice history isn’t available right now."); }
  };
  useEffect(() => { void load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      await PathwayActivityApi.create({ pathway: "faith", moduleKey: "faith-practice-check-in", activityType: "faith-practice-check-in", occurredOn: localActivityDate(), content: { practices, ...(note.trim() ? { note: note.trim() } : {}) } });
      setPractices({}); setNote(""); setMessage("Check-in saved."); await load();
    } catch { setMessage("Couldn’t save this check-in. Try again."); }
    finally { setSaving(false); }
  };

  const counts = Object.fromEntries(Object.keys(practiceLabels).map((key) => [key, new Set(items.filter((item) => "practices" in item.content && item.content.practices[key] === true).map((item) => item.occurredOn)).size]));
  const setChoice = (key: string, value: boolean, checked: boolean) => setPractices((current) => {
    const next = { ...current };
    if (checked) next[key] = value;
    else delete next[key];
    return next;
  });

  return <Box sx={{ display: "grid", gap: 1, mt: 1 }}>
    <Typography variant="caption" color="text.secondary">Only you can see these check-ins.</Typography>
    {Object.entries(practiceLabels).map(([key, label]) => <Box key={key} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, py: .25 }}>
      <Typography variant="body2">{label}</Typography>
      <Box role="group" aria-label={label} sx={{ display: "flex", gap: .5 }}>
        <FormControlLabel control={<Checkbox size="small" checked={practices[key] === true} onChange={(event) => setChoice(key, true, event.target.checked)} />} label="Did" />
        <FormControlLabel control={<Checkbox size="small" checked={practices[key] === false} onChange={(event) => setChoice(key, false, event.target.checked)} />} label="Didn’t" />
      </Box>
    </Box>)}
    <FormControl><FormLabel>Optional note</FormLabel><TextField size="small" value={note} onChange={(event) => setNote(event.target.value)} inputProps={{ maxLength: 500 }} /></FormControl>
    <Button size="small" variant="contained" disabled={saving || (!Object.keys(practices).length && !note.trim())} onClick={() => void save()} sx={{ justifySelf: "start" }}>Save today</Button>
    {message && <Typography role="status" variant="caption">{message}</Typography>}
    <Box component="section" aria-label="Faith practice frequency" sx={{ mt: 1 }}>
      <Typography variant="subtitle2">Your check-ins</Typography>
      {Object.entries(practiceLabels).map(([key, label]) => <Typography key={key} variant="caption" display="block" color="text.secondary">{label} · {counts[key]} {counts[key] === 1 ? "day" : "days"} recorded</Typography>)}
      <Typography variant="caption" color="text.secondary">Counts reflect only check-ins you saved.</Typography>
    </Box>
  </Box>;
}
