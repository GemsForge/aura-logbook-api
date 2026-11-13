import { useCallback, useEffect, useState } from "react";
import { Box, Button, FormControl, FormHelperText, FormLabel, IconButton, Input, Textarea, Typography } from "@mui/joy";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import { localActivityDate, PathwayActivityApi, type PathwayActivity } from "../pathwayActivityApi";

const practices = ["Breath awareness", "Observe", "Describe", "Participate", "Mindful walk", "Other"];

/** Private, explicitly saved practice notes; editing preserves the original journal day. */
export function MindfulPracticeLog() {
  const [practice, setPractice] = useState<string | null>(practices[0]);
  const [duration, setDuration] = useState("");
  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [items, setItems] = useState<PathwayActivity[]>([]);
  const [editing, setEditing] = useState<PathwayActivity | null>(null);
  const [message, setMessage] = useState("");
  const [historyError, setHistoryError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const durationInvalid = duration !== "" && (!Number.isInteger(Number(duration)) || Number(duration) < 1 || Number(duration) > 1440);
  const busy = saving || deletingId !== null;

  const load = useCallback(async () => {
    setLoading(true);
    setHistoryError(false);
    try { setItems(await PathwayActivityApi.getMine({ pathway: "mindfulness", moduleKey: "practice-log", activityType: "mindful-practice" })); }
    catch { setHistoryError(true); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const reset = () => {
    setEditing(null);
    setPractice(practices[0]);
    setDuration("");
    setNote("");
    setNoteOpen(false);
  };

  const save = async () => {
    if (!practice || durationInvalid || busy) return;
    setSaving(true);
    setMessage("");
    try {
      const request = {
        pathway: "mindfulness" as const, moduleKey: "practice-log", activityType: "mindful-practice",
        occurredOn: editing?.occurredOn ?? localActivityDate(),
        content: { practice, ...(duration ? { durationMinutes: Number(duration) } : {}), ...(note.trim() ? { note: note.trim() } : {}) },
      };
      if (editing) await PathwayActivityApi.update(editing.id, request);
      else await PathwayActivityApi.create(request);
      setMessage(editing ? "Practice updated." : "Practice saved.");
      reset();
      await load();
    } catch { setMessage("Couldn’t save your practice. Check the details and try again."); }
    finally { setSaving(false); }
  };

  const edit = (item: PathwayActivity) => {
    if (!("practice" in item.content)) return;
    setEditing(item);
    setPractice(item.content.practice);
    setDuration(item.content.durationMinutes ? String(item.content.durationMinutes) : "");
    setNote(item.content.note ?? "");
    // Editing reveals an existing note rather than hiding the content the user chose to change.
    setNoteOpen(Boolean(item.content.note));
    setMessage("");
  };

  const remove = async (id: number) => {
    if (busy) return;
    setDeletingId(id);
    setMessage("");
    try {
      await PathwayActivityApi.remove(id);
      if (editing?.id === id) reset();
      setMessage("Practice deleted.");
      await load();
    }
    catch { setMessage("Couldn’t delete this practice yet."); }
    finally { setDeletingId(null); }
  };

  return <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) minmax(0, 1.1fr)" }, alignItems: "start", gap: { xs: 2, md: 3 }, mt: 2 }}>
    <Box component="form" className="aura-highlight" onSubmit={(event) => { event.preventDefault(); void save(); }} sx={{ display: "grid", gap: 2, p: { xs: 2, sm: 3 }, minWidth: 0, bgcolor: "var(--al-theme-surface-raised)", borderRadius: "sm" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Box>
        <Typography component="h3" level="title-md">{editing ? "Edit practice" : "What did you try?"}</Typography>
        <Typography level="body-xs" color="neutral" sx={{ mt: .5 }}>{editing ? `Recorded ${editing.occurredOn}` : "Choose a practice. Add only what you want."}</Typography>
        </Box>
        <Box component="img" src="/theme-assets/pathways/mindful/mindful-breathing.png" alt="" sx={{ width: 64, height: 64, objectFit: "contain", flexShrink: 0 }} />
      </Box>
      <Box role="group" aria-label="Practice" sx={{ display: "flex", flexWrap: "wrap", gap: .75 }}>
        {[...new Set([...practices, ...(practice ? [practice] : [])])].map((item) => <Button key={item} type="button" size="sm" color="neutral" variant={practice === item ? "soft" : "plain"} aria-pressed={practice === item} disabled={busy} onClick={() => setPractice(item)} sx={{ minHeight: 44, px: 1, borderRadius: "sm" }}>{item}</Button>)}
      </Box>
      <FormControl disabled={busy} error={durationInvalid} sx={{ maxWidth: 180 }}><FormLabel>Minutes (optional)</FormLabel><Input size="sm" type="number" value={duration} slotProps={{ input: { min: 1, max: 1440, step: 1 } }} onChange={(event) => setDuration(event.target.value)} />{durationInvalid && <FormHelperText>Use 1–1440 whole minutes.</FormHelperText>}</FormControl>
      <Box component="details" open={noteOpen} onToggle={(event) => setNoteOpen(event.currentTarget.open)} sx={{ "& summary": { cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center", fontSize: "var(--joy-fontSize-sm)", color: "var(--al-theme-ink)", "&:focus-visible": { outline: "2px solid var(--al-theme-focus)", outlineOffset: 2 } } }}>
        <Box component="summary">Add a note</Box>
        <FormControl disabled={busy}><FormLabel>Note (optional)</FormLabel><Textarea value={note} minRows={2} maxRows={6} slotProps={{ textarea: { maxLength: 500 } }} onChange={(event) => setNote(event.target.value)} /></FormControl>
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        <Button type="submit" size="sm" startDecorator={<CheckRounded />} loading={saving} disabled={!practice || busy || durationInvalid} sx={{ minHeight: 44 }}>{editing ? "Save changes" : "Save practice"}</Button>
        {editing && <Button size="sm" variant="plain" color="neutral" disabled={busy} onClick={() => { reset(); setMessage(""); }} sx={{ minHeight: 44 }}>Cancel edit</Button>}
      </Box>
      {message && <Typography role="status" level="body-xs">{message}</Typography>}
    </Box>
    <Box component="section" aria-labelledby="saved-practices-title" sx={{ minWidth: 0 }}>
      <Typography id="saved-practices-title" component="h3" level="title-md">Your practice notes</Typography>
      {loading && <Typography role="status" level="body-sm" color="neutral" sx={{ mt: 1 }}>Loading your practices…</Typography>}
      {historyError && <Box sx={{ mt: 1 }}><Typography role="status" level="body-sm">Your practice log isn’t available right now.</Typography><Button size="sm" variant="plain" onClick={() => void load()} sx={{ minHeight: 44, px: .5 }}>Try again</Button></Box>}
      {!loading && !historyError && items.length === 0 && <Typography level="body-sm" color="neutral" sx={{ mt: 1 }}>No practices logged yet. A single moment is a place to start.</Typography>}
      {items.length > 0 && <Box component="ul" aria-label="Saved practices" sx={{ m: 0, p: 0, listStyle: "none" }}>
        {items.map((item) => <Box component="li" key={item.id} sx={{ py: 1.5, borderBottom: "1px solid var(--al-theme-border)", minWidth: 0 }}>
          <Typography level="body-xs" color="neutral"><time dateTime={item.occurredOn}>{item.occurredOn}</time>{"durationMinutes" in item.content && item.content.durationMinutes ? ` · ${item.content.durationMinutes} min` : ""}</Typography>
          <Typography level="title-sm" sx={{ mt: .5, overflowWrap: "anywhere" }}>{"practice" in item.content ? item.content.practice : "Practice"}</Typography>
          {"note" in item.content && item.content.note && <Typography level="body-sm" sx={{ mt: .5, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{item.content.note}</Typography>}
          <Box sx={{ display: "flex", gap: .5, mt: .5 }}>
            <IconButton size="sm" variant="plain" color="neutral" disabled={busy} aria-label={`Edit ${"practice" in item.content ? item.content.practice : "practice"} on ${item.occurredOn}`} onClick={() => edit(item)} sx={{ minHeight: 44, minWidth: 44 }}><EditOutlined /></IconButton>
            <IconButton size="sm" variant="plain" color="neutral" disabled={busy} loading={deletingId === item.id} aria-label={`Delete ${"practice" in item.content ? item.content.practice : "practice"} on ${item.occurredOn}`} onClick={() => void remove(item.id)} sx={{ minHeight: 44, minWidth: 44 }}><DeleteOutlineRounded /></IconButton>
          </Box>
        </Box>)}
      </Box>}
    </Box>
  </Box>;
}
