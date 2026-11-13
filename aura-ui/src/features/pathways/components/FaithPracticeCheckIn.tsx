import { useCallback, useEffect, useState } from "react";
import { Box, Button, Checkbox, FormControl, FormLabel, Textarea, Typography } from "@mui/joy";
import MenuBookRounded from "@mui/icons-material/MenuBookRounded";
import SelfImprovementRounded from "@mui/icons-material/SelfImprovementRounded";
import SpaRounded from "@mui/icons-material/SpaRounded";
import GroupsRounded from "@mui/icons-material/GroupsRounded";
import FavoriteBorderRounded from "@mui/icons-material/FavoriteBorderRounded";
import VolunteerActivismRounded from "@mui/icons-material/VolunteerActivismRounded";
import { localActivityDate, PathwayActivityApi, type PathwayActivity } from "../pathwayActivityApi";
import { InsightFeedback } from "./InsightFeedback";
import { PathwayReflectionPrompt } from "./PathwayReflectionPrompt";

const practiceOptions = [
  { key: "sacred-text-reading", label: "Sacred-text reading", icon: MenuBookRounded },
  { key: "prayer", label: "Prayer or supplication", icon: SelfImprovementRounded },
  { key: "contemplation", label: "Contemplation", icon: SpaRounded },
  { key: "worship-or-gathering", label: "Worship or gathering", icon: GroupsRounded },
  { key: "gratitude", label: "Gratitude", icon: FavoriteBorderRounded },
  { key: "service-or-care", label: "Service or acts of care", icon: VolunteerActivismRounded },
] as const;

/** Keeps practice choice, explicit daily saves, and private frequency counts distinct in a responsive layout. */
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

  const counts = Object.fromEntries(selectedKeys.map((key) => {
    const checkIns = items.filter((item) => "practices" in item.content && key in item.content.practices);
    return [key, {
      did: new Set(checkIns.filter((item) => "practices" in item.content && item.content.practices[key] === true).map((item) => item.occurredOn)).size,
      didnt: new Set(checkIns.filter((item) => "practices" in item.content && item.content.practices[key] === false).map((item) => item.occurredOn)).size,
    }];
  }));
  const preferencesChanged = selectedKeys.length !== savedKeys.length || selectedKeys.some((key) => !savedKeys.includes(key));
  const setChoice = (key: string, value: boolean, checked: boolean) => setPractices((current) => {
    const next = { ...current };
    if (checked) next[key] = value;
    else delete next[key];
    return next;
  });

  return <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.3fr) minmax(0, 1fr)" }, gap: { xs: 3, md: 4 }, mt: 1.5, color: "var(--al-theme-ink)", "& button": { minHeight: 44 } }}>
    <Box sx={{ minWidth: 0 }}>
      <Typography level="body-sm" sx={{ mb: 2, color: "var(--al-theme-ink-muted)" }}>Choose what matters to you. Only you can see these check-ins.</Typography>
      <Box component="fieldset" sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
        <Typography component="legend" level="title-md" sx={{ mb: 1 }}>Choose the practices you want to track</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }, gap: .5 }}>
          {practiceOptions.map(({ key, label, icon: Icon }) => <Checkbox key={key} size="sm" checked={selectedKeys.includes(key)}
            onChange={(event) => setSelectedKeys((current) => event.target.checked ? [...current, key] : current.filter((item) => item !== key))}
            label={<Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}><Icon aria-hidden="true" sx={{ fontSize: 20, color: "var(--al-theme-ink-muted)" }} />{label}</Box>}
            sx={{ minHeight: 44, alignItems: "center", minWidth: 0, py: .5, "& .MuiCheckbox-label": { fontSize: "var(--joy-fontSize-sm)", color: "var(--al-theme-ink)" } }} />)}
        </Box>
      </Box>
      <Button size="sm" variant="soft" disabled={saving} onClick={() => void savePreferences()} sx={{ mt: 1 }}>Save practice choices</Button>
      {preferencesSaved && preferencesChanged && <Typography role="status" level="body-sm" sx={{ mt: 1 }}>Save your updated choices before recording today’s check-in.</Typography>}
      {preferencesSaved && !preferencesChanged && selectedKeys.length > 0 && <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid var(--al-theme-border)" }}>
        <Typography component="h3" level="title-md">Today’s check-in</Typography>
        <Typography level="body-xs" sx={{ mt: .5, mb: 1, color: "var(--al-theme-ink-muted)" }}>Leave any practice unanswered. Nothing is saved until you choose Save today.</Typography>
        {selectedKeys.map((key) => {
          const label = practiceOptions.find((option) => option.key === key)?.label ?? key;
          return <Box key={key} sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1, py: 1 }}>
            <Typography level="body-sm">{label}</Typography>
            {/* Pressing the selected answer again clears it; untouched practices remain unknown. */}
            <Box role="group" aria-label={label} sx={{ display: "flex", flexWrap: "wrap", gap: .5 }}>
              <Button size="sm" variant={practices[key] === true ? "soft" : "plain"} aria-pressed={practices[key] === true} onClick={() => setChoice(key, true, practices[key] !== true)}>Did</Button>
              <Button size="sm" variant={practices[key] === false ? "soft" : "plain"} aria-pressed={practices[key] === false} onClick={() => setChoice(key, false, practices[key] !== false)}>Didn’t today</Button>
            </Box>
          </Box>;
        })}
        <FormControl sx={{ mt: 1 }}>
          <FormLabel htmlFor="faith-practice-note">Optional note</FormLabel>
          <Textarea id="faith-practice-note" size="sm" minRows={2} maxRows={4} value={note} onChange={(event) => setNote(event.target.value)} slotProps={{ textarea: { maxLength: 500 } }} />
        </FormControl>
        <Button size="sm" variant="solid" disabled={saving || (!Object.keys(practices).length && !note.trim())} onClick={() => void save()} sx={{ mt: 1 }}>Save today</Button>
      </Box>}
      {preferencesSaved && !preferencesChanged && selectedKeys.length === 0 && <Typography level="body-sm" sx={{ mt: 2 }}>You chose not to track any practices right now. You can change this selection above.</Typography>}
      {message && <Typography role="status" level="body-sm" sx={{ mt: 1 }}>{message}</Typography>}
    </Box>
    <Box component="aside" aria-label="Faith practice frequency" sx={{ minWidth: 0 }}>
      <Typography component="h3" level="title-md">Your practice, at your pace</Typography>
      <Typography level="body-sm" sx={{ mt: .75, color: "var(--al-theme-ink-muted)" }}>A record of the moments you choose to notice. There’s no right number of practices to keep.</Typography>
      {preferencesSaved && !preferencesChanged && selectedKeys.length > 0 ? <InsightFeedback pathway="faith" moduleKey="faith-practice-check-in" insightType="faith-practice" hideContentWhenNotForMe>
        <Box sx={{ mb: 2 }}>
          <Typography component="h4" level="title-sm">Your check-ins</Typography>
          {selectedKeys.map((key) => {
            const option = practiceOptions.find((item) => item.key === key);
            const Icon = option?.icon ?? SpaRounded;
            return <Box key={key} sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
              <Icon aria-hidden="true" sx={{ fontSize: 20, color: "var(--al-theme-ink-muted)" }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography level="body-sm">{option?.label ?? key}</Typography>
                <Typography level="body-xs" sx={{ color: "var(--al-theme-ink-muted)" }}>Did {counts[key].did} days · Didn’t {counts[key].didnt} days</Typography>
              </Box>
            </Box>;
          })}
          <Typography level="body-xs" sx={{ mt: 1, color: "var(--al-theme-ink-muted)" }}>Counts reflect only check-ins you saved. No score or streak.</Typography>
          <PathwayReflectionPrompt pathway="faith" moduleKey="faith-practice-check-in" insightType="faith-practice" prompt="Would you like to reflect on any of these practices?" />
        </Box>
      </InsightFeedback> : <Typography level="body-sm" sx={{ mt: 2, color: "var(--al-theme-ink-muted)" }}>When you save a check-in, your selected practices’ counts will appear here.</Typography>}
    </Box>
  </Box>;
}
