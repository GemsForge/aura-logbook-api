import { useCallback, useEffect, useState } from "react";
import { Box, Button, IconButton, Textarea, Typography } from "@mui/joy";
import { Link } from "react-router-dom";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import MenuBookRounded from "@mui/icons-material/MenuBookRounded";
import SelfImprovementRounded from "@mui/icons-material/SelfImprovementRounded";
import AutoAwesomeRounded from "@mui/icons-material/AutoAwesomeRounded";
import { tapTarget44 } from "@/components/ui/tapTarget";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import { PathwayActivityApi, type PathwayActivity, type PathwayActivityRequest } from "../pathwayActivityApi";

/** A saved reflection; reader reflections also carry the passage (`reference`, optional `segment`) they were written on. */
type SavedReflection = PathwayActivity & {
  content: { insightType: string; prompt: string; responseText: string; reference?: string; segment?: string };
};

/** Reader link for a reflection written in the sacred-text reader, or null for other pathway reflections. */
function passageLink(item: SavedReflection): string | null {
  if (item.moduleKey !== "sacred-texts" || !item.content.reference) return null;
  const params = new URLSearchParams({ reference: item.content.reference });
  if (item.content.segment) params.set("segment", item.content.segment);
  return `/pathways/sacred-texts/reader?${params.toString()}`;
}

function isSavedReflection(activity: PathwayActivity): activity is SavedReflection {
  return activity.activityType === "pathway-reflection"
    && "responseText" in activity.content && "prompt" in activity.content && "insightType" in activity.content;
}

const pathwayNames = { faith: "Faith & Religion", mindfulness: "Mindfulness", energy: "Energy" } as const;
const moduleNames: Record<string, string> = { "sacred-texts": "Sacred texts", "faith-practice-check-in": "Faith practice", "mindfulness-guide": "Mindful Living", "practice-log": "Practice log", "daily-astrology": "Astrology & Energy", "chakra-reference": "Chakra reference" };
const pathwayStyles = {
  faith: { color: "#8a5b24", icon: MenuBookRounded },
  mindfulness: { color: "#287568", icon: SelfImprovementRounded },
  energy: { color: "#6d5aa4", icon: AutoAwesomeRounded },
} as const;

/** Renders one saved pathway reflection using readable pathway and module labels and its existing actions. */
export function PathwayReflectionCard({ item, onEdit, onDelete, onSave, editing = false, draft = "", onDraftChange, onCancelEdit }: { item: SavedReflection; onEdit: (item: SavedReflection) => void; onDelete: (item: SavedReflection) => void; onSave?: () => void; editing?: boolean; draft?: string; onDraftChange?: (value: string) => void; onCancelEdit?: () => void }) {
  const style = pathwayStyles[item.pathway];
  const PathwayIcon = style.icon;
  const link = passageLink(item);
  return <Box component="article" aria-label={`${pathwayNames[item.pathway]} reflection from ${item.occurredOn}`}
    sx={{ minWidth: 0, pl: 1.5, py: .25, borderLeft: `3px solid ${style.color}` }}>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
      <Typography level="body-xs" color="neutral"><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time></Typography>
      <Box sx={{ display: "flex", flexShrink: 0 }}>
        <IconButton size="sm" variant="plain" onClick={() => onEdit(item)} aria-label={`Edit ${pathwayNames[item.pathway]} reflection`} sx={tapTarget44}><EditOutlined fontSize="small" /></IconButton>
        <IconButton size="sm" variant="plain" color="danger" onClick={() => onDelete(item)} aria-label={`Delete ${pathwayNames[item.pathway]} reflection`} sx={tapTarget44}><DeleteOutline fontSize="small" /></IconButton>
      </Box>
    </Box>
    <Typography level="body-xs" sx={{ display: "flex", alignItems: "center", gap: .5, fontWeight: 700, color: style.color, mt: .25 }}><PathwayIcon aria-hidden="true" fontSize="small" />{pathwayNames[item.pathway]} · {moduleNames[item.moduleKey] ?? item.moduleKey.replace(/-/g, " ")}</Typography>
    <Typography level="body-sm" sx={{ mt: .5 }}>{item.content.prompt}</Typography>
    {link && <Button component={Link} to={link} size="sm" variant="plain" sx={{ px: 0, minHeight: 44 }}>Open {item.content.segment ?? item.content.reference}</Button>}
    {editing
      ? <>
        <Textarea aria-label="Edit saved reflection" value={draft} minRows={2} maxRows={6} slotProps={{ textarea: { maxLength: 2000 } }} onChange={(event) => onDraftChange?.(event.target.value)} sx={{ mt: .5 }} />
        <Box sx={{ display: "flex", gap: .5, mt: .5 }}>
          <IconButton size="sm" variant="plain" aria-label="Save reflection changes" disabled={!draft.trim()} onClick={onSave} sx={tapTarget44}><CheckOutlined /></IconButton>
          <IconButton size="sm" variant="plain" aria-label="Cancel editing reflection" onClick={onCancelEdit} sx={tapTarget44}><CloseOutlined /></IconButton>
        </Box>
      </>
      : <Typography level="body-md" sx={{ mt: .5, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{item.content.responseText}</Typography>}
  </Box>;
}

/** Retains the legacy standalone pathway reflection list for existing consumers; history uses the shared timeline card. */
export function PathwayReflectionJournal({ onItemsChange }: { onItemsChange?: (items: PathwayActivity[]) => void } = {}) {
  const [items, setItems] = useState<SavedReflection[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const activities = await PathwayActivityApi.getMine({ activityType: "pathway-reflection" });
      const reflections = activities.filter(isSavedReflection);
      setItems(reflections);
      onItemsChange?.(reflections);
    } catch {
      setMessage("Saved pathway reflections aren’t available right now.");
    }
  }, [onItemsChange]);
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

  if (onItemsChange) return null;
  return <Box component="section" aria-labelledby="pathway-reflections-title" sx={{ mt: 3 }}>
    <Typography id="pathway-reflections-title" component="h2" level="title-lg">Pathway reflections</Typography>
    {items.length === 0 && !message && <Typography level="body-sm" color="neutral" sx={{ mt: .5 }}>Written pathway reflections you save will appear here.</Typography>}
    {items.map((item) => <Box component="article" key={item.id} aria-label={`${item.pathway} reflection from ${item.occurredOn}`}
      sx={{ py: 1.25, borderBottom: "1px solid var(--al-theme-border)" }}>
      <Typography level="body-xs" color="neutral">{item.occurredOn} · {item.moduleKey.replace(/-/g, " ")}</Typography>
      <Typography level="body-sm" sx={{ mt: .5 }}>{item.content.prompt}</Typography>
      {passageLink(item) && <Button component={Link} to={passageLink(item)!} size="sm" variant="plain" sx={{ px: 0 }}>Open {item.content.segment ?? item.content.reference}</Button>}
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
