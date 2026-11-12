import type { MoodEntry } from "@/features/mood/models/schema";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import IconButton from "@mui/joy/IconButton";
import dayjs from "dayjs";
import { Link as RouterLink } from "react-router-dom";
import MarkdownReflection from "../MarkdownReflection";
import MomentStrip from "./MomentStrip";
import { tapTarget44 } from "@/components/ui/tapTarget";
import { useGetReferenceDataQuery } from "@/store/referenceDataApi";

/**
 * One reflection, read like a journal entry: a margin rule in the first mood's aura color, the logged time
 * and moods as a quiet line, the writing in the serif voice, then the moment strip (song, weather, photos).
 * Photos appear only in the moment strip; the card offers no photo management controls.
 */
export function MoodCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: MoodEntry;
  onEdit: (entry: MoodEntry) => void;
  onDelete: (entry: MoodEntry) => void;
}) {
  const { data: referenceData } = useGetReferenceDataQuery();
  const moodDefinition = referenceData?.moods.find((definition) => definition.key === entry.moods[0]);
  const aura = referenceData?.auras.find((definition) => definition.key === moodDefinition?.auraColorKeys[0]);
  const time = entry.createdAt ? dayjs(entry.createdAt).format("h:mm A") : dayjs(entry.date).format("MMM D");
  return (
    <Box component="article" aria-label={`${time} reflection: ${entry.moods.join(", ")}`} sx={{ pl: 1.5, py: .25, borderLeft: "3px solid", borderColor: aura?.shades?.[500] ?? aura?.baseHex ?? "var(--aura-accent)" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
        <Typography level="body-xs" color="neutral">{time} · {entry.moods.join(", ")}</Typography>
        <Box sx={{ display: "flex", flexShrink: 0 }}>
          <IconButton size="sm" variant="plain" onClick={() => onEdit(entry)} aria-label="Edit mood entry" sx={tapTarget44}><EditOutlined fontSize="small" /></IconButton>
          <IconButton size="sm" variant="plain" onClick={() => onDelete(entry)} aria-label="Delete mood entry" sx={tapTarget44}><DeleteOutline fontSize="small" /></IconButton>
        </Box>
      </Box>
      {/* The writing opens the full reading view; long reflections are clamped here as a preview. The link's name is the text itself (WCAG 1.3.1/2.4.4), not a replacement label. */}
      <Box component={RouterLink} to={`/history/${entry.id}`}
        sx={{ display: "block", color: "inherit", textDecoration: "none", borderRadius: "sm", "&:hover": { textDecoration: "underline", textDecorationColor: "var(--aura-line)" }, "&:focus-visible": { outline: "2px solid var(--al-theme-focus)", outlineOffset: 2 } }}>
        {entry.comment
          ? <Box sx={{ fontFamily: "var(--joy-fontFamily-display)", fontSize: "1rem", lineHeight: 1.6, overflowWrap: "anywhere", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden", "& p": { m: 0 } }}><MarkdownReflection value={entry.comment} /></Box>
          : <Typography level="body-sm" color="neutral">Open this check-in</Typography>}
        {/* The link reads the reflection itself, then this hidden suffix names the destination. */}
        <Box component="span" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>, read full reflection</Box>
      </Box>
      <MomentStrip entry={entry} />
    </Box>
  );
}
