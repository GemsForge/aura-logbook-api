import { Box, Button, Checkbox, Typography } from "@mui/joy";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import { useEffect, useState } from "react";
import type { SacredTextAnnotation } from "@/store/auraApi";

/** Keeps private annotations visible beside desktop reading and available on demand on mobile. */
export function SacredTextNotesPanel({
  annotations,
  isSaving,
  isDeleting,
  isOpen,
  onExport,
  onPrint,
  onEdit,
  onDelete,
  onToggle,
}: {
  annotations: SacredTextAnnotation[];
  isSaving: boolean;
  isDeleting: boolean;
  isOpen: boolean;
  onExport(format: "markdown" | "json", annotationIds?: number[]): void;
  onPrint(): void;
  onEdit(annotation: SacredTextAnnotation): void;
  onDelete(annotation: SacredTextAnnotation): void;
  onToggle(): void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => setSelectedIds(new Set()), [annotations]);

  const toggleSelected = (id: number, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return <>
    <Box id="sacred-reader-notes-panel" className={`sacred-reader-notes ${isOpen ? "is-open" : ""}`} component="aside" aria-label="Private notes and highlights">
      <Box className="sacred-reader-notes-header">
        <Box><Typography component="h2" level="title-md">Your notes</Typography><Typography level="body-xs" sx={{ color: "var(--al-theme-ink-muted)" }}>Private to you · {annotations.length} saved</Typography></Box>
        <Button size="sm" variant="plain" onClick={() => onExport("markdown")} startDecorator={<DownloadRounded />}>Export all Markdown</Button>
      </Box>
      <Box className="sacred-reader-export-actions">
        <Button size="sm" variant="plain" onClick={() => onExport("json")}>Export all JSON</Button>
        <Button size="sm" variant="plain" disabled={selectedIds.size === 0} onClick={() => onExport("markdown", [...selectedIds])}>Export selected Markdown</Button>
        <Button size="sm" variant="plain" disabled={selectedIds.size === 0} onClick={() => onExport("json", [...selectedIds])}>Export selected JSON</Button>
        <Button size="sm" variant="plain" onClick={onPrint}>Print / PDF</Button>
      </Box>
      {annotations.length > 0 && <Typography level="body-xs" sx={{ mt: 1, color: "var(--al-theme-ink-muted)" }}>Choose items for a selected export, or export all saved items.</Typography>}
      {annotations.length === 0 ? <Typography level="body-sm" sx={{ mt: 2, color: "var(--al-theme-ink-muted)" }}>Highlights and notes you save in this section will appear here.</Typography>
        : <Box component="ul" className="sacred-reader-note-list">{annotations.map((annotation) => <Box component="li" key={annotation.id} className="sacred-reader-note-item">
          <Checkbox size="sm" checked={selectedIds.has(annotation.id)} onChange={(event) => toggleSelected(annotation.id, event.target.checked)} label={`Select ${annotation.segmentReference ?? annotation.sectionReference} ${annotation.kind} for export`} />
          <Typography level="body-xs" sx={{ color: "var(--al-theme-primary)" }}>{annotation.segmentReference ?? annotation.sectionReference} · {annotation.kind}</Typography>
          {annotation.note && <Typography level="body-sm" sx={{ mt: .5, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{annotation.note}</Typography>}
          <Box className="sacred-reader-note-actions">
            {annotation.kind === "note" && <Button size="sm" variant="plain" onClick={() => onEdit(annotation)}>Edit</Button>}
            <Button size="sm" variant="plain" color="danger" disabled={isDeleting} onClick={() => onDelete(annotation)}>Delete</Button>
          </Box>
        </Box>)}</Box>}
      <Typography level="body-xs" sx={{ mt: 2, color: "var(--al-theme-ink-muted)" }}>Notes and bookmarks are not journal entries and do not mark a reading complete.</Typography>
      {isSaving && <Typography role="status" level="body-xs" sx={{ mt: 1 }}>Saving privately…</Typography>}
    </Box>
    <Button className="sacred-reader-mobile-notes-toggle" size="md" variant="soft" onClick={onToggle} aria-expanded={isOpen} aria-controls="sacred-reader-notes-panel">
      {isOpen ? "Close notes" : `Your notes · ${annotations.length}`}
    </Button>
  </>;
}
