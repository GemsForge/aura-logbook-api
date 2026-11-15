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
import { PathwaySteps, StepHeading, type PathwayStep } from "./PathwaySteps";

const practiceOptions = [
  { key: "sacred-text-reading", label: "Sacred-text reading", icon: MenuBookRounded },
  { key: "prayer", label: "Prayer or supplication", icon: SelfImprovementRounded },
  { key: "contemplation", label: "Contemplation", icon: SpaRounded },
  { key: "worship-or-gathering", label: "Worship or gathering", icon: GroupsRounded },
  { key: "gratitude", label: "Gratitude", icon: FavoriteBorderRounded },
  { key: "service-or-care", label: "Service or acts of care", icon: VolunteerActivismRounded },
] as const;

/** Presents the faith check-in as a short path (Choose → Check in → Look back); each save stays an explicit action. */
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
  // Returning users open on today’s check-in; first-time users open on choosing practices.
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
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
        setStep(1);
      }
    }
    catch { setLoadError(true); }
    finally { setLoading(false); }
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
      setStep(1);
      setPractices({});
      setMessage("Your practice choices are saved.");
    } catch { setMessage("Couldn’t save your practice choices. Try again."); }
    finally { setSaving(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      await PathwayActivityApi.create({ pathway: "faith", moduleKey: "faith-practice-check-in", activityType: "faith-practice-check-in", occurredOn: localActivityDate(), content: { practices, ...(note.trim() ? { note: note.trim() } : {}) } });
      setPractices({}); setNote(""); setMessage("Check-in saved."); await load(); setStep(2);
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

  // Load and failure states sit outside the path so a failed load is never mistaken for first-time setup.
  if (loading) return <Typography role="status" level="body-sm" sx={{ py: 2 }}>Loading your practice check-in…</Typography>;
  if (loadError) return <Box sx={{ py: 2 }}>
    <Typography role="status" level="body-sm">Your practice history isn’t available right now.</Typography>
    <Button size="sm" variant="plain" onClick={() => void load()} sx={{ mt: 1, minHeight: 44 }}>Try again</Button>
  </Box>;

  const ready = preferencesSaved && !preferencesChanged;
  const canSave = !saving && (Object.keys(practices).length > 0 || note.trim().length > 0);
  const steps: PathwayStep[] = [
    { title: "Choose", summary: preferencesSaved ? `${savedKeys.length} ${savedKeys.length === 1 ? "practice" : "practices"}` : undefined, content: <>
      <Box component="fieldset" sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
        <Box component="legend" sx={{ p: 0 }}><StepHeading>What do you want to track?</StepHeading></Box>
        <Typography level="body-sm" color="neutral" sx={{ mt: 1, mb: 1.5 }}>Pick any that fit. You can change these later.</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }, gap: .5 }}>
          {practiceOptions.map(({ key, label, icon: Icon }) => <Checkbox key={key} size="sm" checked={selectedKeys.includes(key)}
            onChange={(event) => setSelectedKeys((current) => event.target.checked ? [...current, key] : current.filter((item) => item !== key))}
            label={<Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}><Icon aria-hidden="true" sx={{ fontSize: 20, color: "var(--al-theme-ink-muted)" }} />{label}</Box>}
            sx={{ minHeight: 44, alignItems: "center", minWidth: 0, py: .5, "& .MuiCheckbox-label": { fontSize: "var(--joy-fontSize-sm)", color: "var(--al-theme-ink)" } }} />)}
        </Box>
      </Box>
      <Button variant="solid" disabled={saving} onClick={() => void savePreferences()} sx={{ mt: 2, borderRadius: 999 }}>Save practice choices</Button>
    </> },
    { title: "Check in", hint: preferencesSaved ? undefined : "after choosing", content: <>
      <StepHeading>Today’s check-in</StepHeading>
      {!preferencesSaved && <Typography level="body-sm" sx={{ mt: 1 }}>Choose your practices first.</Typography>}
      {preferencesSaved && preferencesChanged && <Typography role="status" level="body-sm" sx={{ mt: 1 }}>Save your updated choices before recording today’s check-in.</Typography>}
      {ready && selectedKeys.length === 0 && <Typography level="body-sm" sx={{ mt: 1 }}>You’re not tracking any practices right now. Open Choose whenever you want to change that.</Typography>}
      {ready && selectedKeys.length > 0 && <>
        <Typography level="body-sm" color="neutral" sx={{ mt: 1, mb: 1 }}>Answer any you like. Nothing is saved until you choose Save today.</Typography>
        {selectedKeys.map((key) => {
          const option = practiceOptions.find((item) => item.key === key);
          const label = option?.label ?? key;
          const Icon = option?.icon ?? SpaRounded;
          // Name on its own line, then a two-option pill pair, so every row has the same shape at any width.
          return <Box key={key} sx={{ py: 1.25, borderBottom: "1px solid var(--al-theme-border)" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><Icon aria-hidden="true" sx={{ fontSize: 20, color: "var(--al-theme-ink-muted)" }} /><Typography level="body-md">{label}</Typography></Box>
            {/* Pressing the selected answer again clears it; untouched practices remain unknown. */}
            <Box role="group" aria-label={label} sx={{ display: "flex", gap: 1, mt: 1 }}>
              {([[true, "Did"], [false, "Didn’t today"]] as const).map(([value, text]) => <Button key={text} variant={practices[key] === value ? "solid" : "outlined"} color={practices[key] === value ? "primary" : "neutral"}
                aria-pressed={practices[key] === value} onClick={() => setChoice(key, value, practices[key] !== value)}
                sx={{ borderRadius: 999, px: 2, fontWeight: 600, borderColor: practices[key] === value ? undefined : "var(--al-theme-control-border)", color: practices[key] === value ? undefined : "var(--al-theme-ink)" }}>{text}</Button>)}
            </Box>
          </Box>;
        })}
        <Box component="details" sx={{ mt: 1, "& summary": { cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center", fontSize: "var(--joy-fontSize-sm)", color: "var(--al-theme-primary)", fontWeight: 600, "&:focus-visible": { outline: "2px solid var(--al-theme-focus)", outlineOffset: 2 } } }}>
          <Box component="summary">Add a note</Box>
          <FormControl>
            <FormLabel htmlFor="faith-practice-note">Optional note</FormLabel>
            <Textarea size="sm" minRows={2} maxRows={4} value={note} onChange={(event) => setNote(event.target.value)} slotProps={{ textarea: { id: "faith-practice-note", maxLength: 500 } }} />
          </FormControl>
        </Box>
        {/* Disabled save keeps its filled pill shape (dimmed) so the action stays recognizable, with a hint for what enables it. */}
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, mt: 1.5 }}>
          <Button variant="solid" disabled={!canSave} onClick={() => void save()} sx={{ borderRadius: 999, "&.Mui-disabled": { bgcolor: "var(--al-theme-primary)", color: "var(--al-theme-primary-contrast)", opacity: .45 } }}>Save today</Button>
          {!canSave && !saving && <Typography level="body-sm" color="neutral">Answer one to save.</Typography>}
        </Box>
      </>}
    </> },
    { title: "Look back", hint: "optional", content: <Box component="aside" aria-label="Faith practice frequency">
      <StepHeading>Your practice, at your pace</StepHeading>
      <Box component="img" src="/theme-assets/pathways/faith-religion/faith-religion-olive-branch.png" alt="" sx={{ display: "block", width: { xs: 96, md: 144 }, height: { xs: 72, md: 108 }, objectFit: "contain", my: 1 }} />
      {ready && selectedKeys.length > 0 ? <InsightFeedback pathway="faith" moduleKey="faith-practice-check-in" insightType="faith-practice" hideContentWhenNotForMe>
        <Box sx={{ mb: 2 }}>
          <Typography component="h4" level="title-sm">Your check-ins</Typography>
          {selectedKeys.map((key) => {
            const option = practiceOptions.find((item) => item.key === key);
            const Icon = option?.icon ?? SpaRounded;
            return <Box key={key} sx={{ display: "flex", alignItems: "center", gap: 1, py: 1, borderBottom: "1px solid var(--al-theme-border)" }}>
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
      </InsightFeedback> : <Typography level="body-sm" sx={{ mt: 1, color: "var(--al-theme-ink-muted)" }}>When you save a check-in, your practice counts will appear here.</Typography>}
    </Box> },
  ];

  return <Box sx={{ mt: 1.5, color: "var(--al-theme-ink)", "& button": { minHeight: 44 } }}>
    <PathwaySteps label="Practice check-in steps" steps={steps} current={step} onStepChange={setStep} />
    {message && <Typography role="status" level="body-sm" sx={{ mt: 1 }}>{message}</Typography>}
  </Box>;
}
