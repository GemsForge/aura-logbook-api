import { useCallback, useEffect, useState } from "react";
import { Box, Button, IconButton, Textarea, Typography } from "@mui/joy";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import { PathwayActivityApi, type PathwayActivity, type PathwayActivityRequest } from "../pathwayActivityApi";

type SavedReflection = PathwayActivity & {
  content: { insightType: string; prompt: string; responseText: string };
};

function isSavedReflection(activity: PathwayActivity): activity is SavedReflection {
  return activity.activityType === "pathway-reflection"
    && "responseText" in activity.content && "prompt" in activity.content && "insightType" in activity.content;
}

/** Lists private pathway reflections in the journal with explicit edit and delete actions. */
export function PathwayReflectionJournal() {
  const [items, setItems] = useState<SavedReflection[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const activities = await PathwayActivityApi.getMine({ activityType: "pathway-reflection" });
      setItems(activities.filter(isSavedReflection));
    } catch {
      setMessage("Saved pathway reflections aren’t available right now.");
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const saveEdit = async (item: SavedReflection) => {
    const responseText = draft.trim();
    if (!responseText) return;
    const request: PathwayActivityRequest = {
      pathway: item.pathway,
      moduleKey: item.moduleKey,
      activityType: item.activityType,
      occurredOn: item.occurredOn,
      content: { ...item.content, responseText },
    };
    try {
      await PathwayActivityApi.update(item.id, request);
      setEditingId(null);
      setDraft("");
      setMessage("Journal reflection updated.");
      await load();
    } catch {
      setMessage("Couldn’t update this reflection. Try again.");
    }
  };

  const remove = async (id: number) => {
    try {
      await PathwayActivityApi.remove(id);
      setDeleteId(null);
      setMessage("Journal reflection deleted.");
      await load();
    } catch {
      setMessage("Couldn’t delete this reflection. Try again.");
    }
  };

  return <Box component="section" aria-labelledby="pathway-reflections-title" sx={{ mt: 3 }}>
    <Typography id="pathway-reflections-title" component="h2" level="title-lg">Pathway reflections</Typography>
    {items.length === 0 && !message && <Typography level="body-sm" color="neutral" sx={{ mt: .5 }}>Written pathway reflections you save will appear here.</Typography>}
    {items.map((item) => <Box component="article" key={item.id} aria-label={`${item.pathway} reflection from ${item.occurredOn}`}
      sx={{ py: 1.25, borderBottom: "1px solid var(--al-theme-border)" }}>
      <Typography level="body-xs" color="neutral">{item.occurredOn} · {item.moduleKey.replace(/-/g, " ")}</Typography>
      <Typography level="body-sm" sx={{ mt: .5 }}>{item.content.prompt}</Typography>
      {editingId === item.id
        ? <>
          <Textarea aria-label="Edit saved reflection" value={draft} minRows={2} maxRows={6} slotProps={{ textarea: { maxLength: 2000 } }} onChange={(event) => setDraft(event.target.value)} sx={{ mt: .5 }} />
          <Box sx={{ display: "flex", gap: .5, mt: .5 }}>
            <IconButton size="sm" variant="plain" aria-label="Save reflection changes" disabled={!draft.trim()} onClick={() => void saveEdit(item)}><CheckOutlined /></IconButton>
            <IconButton size="sm" variant="plain" aria-label="Cancel editing reflection" onClick={() => { setEditingId(null); setDraft(""); }}><CloseOutlined /></IconButton>
          </Box>
        </>
        : <Typography level="body-md" sx={{ mt: .5, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{item.content.responseText}</Typography>}
      <Box sx={{ display: "flex", gap: .5, mt: .5 }}>
        {editingId !== item.id && <IconButton size="sm" variant="plain" aria-label="Edit saved reflection" title="Edit" onClick={() => { setEditingId(item.id); setDraft(item.content.responseText); }}><EditOutlined /></IconButton>}
        {deleteId === item.id
          ? <><Typography level="body-xs" sx={{ alignSelf: "center" }}>Delete this reflection?</Typography>
            <Button size="sm" variant="plain" color="danger" onClick={() => void remove(item.id)}>Delete</Button>
            <Button size="sm" variant="plain" onClick={() => setDeleteId(null)}>Keep</Button></>
          : <IconButton size="sm" variant="plain" color="danger" aria-label="Delete saved reflection" title="Delete" onClick={() => setDeleteId(item.id)}><DeleteOutline /></IconButton>}
      </Box>
    </Box>)}
    {message && <Typography role="status" level="body-xs" sx={{ mt: .5 }}>{message}</Typography>}
  </Box>;
}
