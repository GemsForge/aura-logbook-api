import { useCallback, useEffect, useState } from "react";
import { Box, Button, Checkbox, FormControl, FormControlLabel, FormLabel, TextField, Typography } from "@mui/material";
import { localActivityDate, PathwayActivityApi, type PathwayActivity } from "../pathwayActivityApi";

const practiceOptions = [
  { key: "sacred-text-reading", label: "Sacred-text reading" },
  { key: "prayer", label: "Prayer or supplication" },
  { key: "contemplation", label: "Contemplation" },
  { key: "worship-or-gathering", label: "Worship or gathering" },
  { key: "gratitude", label: "Gratitude" },
  { key: "service-or-care", label: "Service or acts of care" },
] as const;

/** Lets users privately choose faith practices, record only those choices, and review simple counts. */
export function FaithPracticeCheckIn() {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [savedKeys, setSavedKeys] = useState<string[]>([]);
  const [preferencesSaved, setPreferencesSaved] = useState(false);
  const [preferenceId, setPreferenceId] = useState<number | null>(null);
  const [practices, setPractices] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState("");
  const [items, setItems] = useState<PathwayActivity[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [checkIns, preferences] = await Promise.all([
        PathwayActivityApi.getMine({ pathway: "faith", moduleKey: "faith-practice-check-in", activityType: "faith-practice-check-in" }),
        PathwayActivityApi.getMine({ pathway: "faith", moduleKey: "faith-practice-check-in", activityType: "faith-practice-preferences" }),
      ]);
      setItems(checkIns);
      const saved = preferences.find((item) => "practiceKeys" in item.content);
      if (saved && "practiceKeys" in saved.content) {
        setPreferenceId(saved.id);
        setSelectedKeys(saved.content.practiceKeys);
        setSavedKeys(saved.content.practiceKeys);
        setPreferencesSaved(true);
      }
    }
    catch { setMessage("Your practice history isn’t available right now."); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const savePreferences = async () => {
    setSaving(true);
    try {
      const request = {
        pathway: "faith" as const,
        moduleKey: "faith-practice-check-in",
        activityType: "faith-practice-preferences",
        occurredOn: localActivityDate(),
        content: { practiceKeys: selectedKeys },
      };
      if (preferenceId !== null) await PathwayActivityApi.update(preferenceId, request);
      else {
        const created = await PathwayActivityApi.create(request);
        setPreferenceId(created.id);
      }
      setSavedKeys([...selectedKeys]);
      setPreferencesSaved(true);
      setPractices({});
      setMessage("Your practice choices are saved.");
    } catch { setMessage("Couldn’t save your practice choices. Try again."); }
    finally { setSaving(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      await PathwayActivityApi.create({ pathway: "faith", moduleKey: "faith-practice-check-in", activityType: "faith-practice-check-in", occurredOn: localActivityDate(), content: { practices, ...(note.trim() ? { note: note.trim() } : {}) } });
      setPractices({}); setNote(""); setMessage("Check-in saved."); await load();
    } catch { setMessage("Couldn’t save this check-in. Try again."); }
    finally { setSaving(false); }
  };

  const counts = Object.fromEntries(selectedKeys.map((key) => [key, new Set(items.filter((item) => "practices" in item.content && item.content.practices[key] === true).map((item) => item.occurredOn)).size]));
  const preferencesChanged = selectedKeys.length !== savedKeys.length || selectedKeys.some((key) => !savedKeys.includes(key));
  const setChoice = (key: string, value: boolean, checked: boolean) => setPractices((current) => {
    const next = { ...current };
    if (checked) next[key] = value;
    else delete next[key];
    return next;
  });

  return <Box sx={{ display: "grid", gap: 1, mt: 1 }}>
    <Typography variant="caption" color="text.secondary">Only you can see these check-ins.</Typography>
    <Box component="fieldset" sx={{ border: 0, p: 0, m: 0 }}>
      <Typography component="legend" variant="subtitle2">Choose the practices you want to track</Typography>
      {practiceOptions.map(({ key, label }) => <FormControlLabel key={key} control={<Checkbox size="small" checked={selectedKeys.includes(key)} onChange={(event) => setSelectedKeys((current) => event.target.checked ? [...current, key] : current.filter((item) => item !== key))} />} label={label} />)}
    </Box>
    <Button size="small" variant="outlined" disabled={saving} onClick={() => void savePreferences()} sx={{ justifySelf: "start" }}>Save practice choices</Button>
    {preferencesSaved && preferencesChanged && <Typography role="status" variant="caption">Save your updated choices before recording today’s check-in.</Typography>}
    {preferencesSaved && !preferencesChanged && selectedKeys.map((key) => {
      const label = practiceOptions.find((option) => option.key === key)?.label ?? key;
      return <Box key={key} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, py: .25 }}>
        <Typography variant="body2">{label}</Typography>
        <Box role="group" aria-label={label} sx={{ display: "flex", gap: .5 }}>
          <FormControlLabel control={<Checkbox size="small" checked={practices[key] === true} onChange={(event) => setChoice(key, true, event.target.checked)} />} label="Did" />
          <FormControlLabel control={<Checkbox size="small" checked={practices[key] === false} onChange={(event) => setChoice(key, false, event.target.checked)} />} label="Didn’t" />
        </Box>
      </Box>;
    })}
    {preferencesSaved && !preferencesChanged && selectedKeys.length === 0 && <Typography variant="body2" color="text.secondary">You chose not to track any practices right now. You can change this selection above.</Typography>}
    {preferencesSaved && !preferencesChanged && selectedKeys.length > 0 && <>
      <FormControl><FormLabel>Optional note</FormLabel><TextField size="small" value={note} onChange={(event) => setNote(event.target.value)} inputProps={{ maxLength: 500 }} /></FormControl>
      <Button size="small" variant="contained" disabled={saving || (!Object.keys(practices).length && !note.trim())} onClick={() => void save()} sx={{ justifySelf: "start" }}>Save today</Button>
    </>}
    {message && <Typography role="status" variant="caption">{message}</Typography>}
    {preferencesSaved && !preferencesChanged && selectedKeys.length > 0 && <Box component="section" aria-label="Faith practice frequency" sx={{ mt: 1 }}>
      <Typography variant="subtitle2">Your check-ins</Typography>
      {selectedKeys.map((key) => {
        const label = practiceOptions.find((option) => option.key === key)?.label ?? key;
        return <Typography key={key} variant="caption" display="block" color="text.secondary">{label} · {counts[key]} {counts[key] === 1 ? "day" : "days"} recorded</Typography>;
      })}
      <Typography variant="caption" color="text.secondary">Counts reflect only check-ins you saved.</Typography>
    </Box>}
  </Box>;
}
