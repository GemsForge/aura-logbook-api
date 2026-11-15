import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { TextAnnotation } from "@recogito/react-text-annotator";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormLabel,
  Autocomplete,
  Input,
  Modal,
  ModalDialog,
  Select,
  Option,
  Textarea,
  Typography,
} from "@mui/joy";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import { sacredTextBookOptions } from "@/features/pathways/sacredTextBooks";
import BookmarkBorderRounded from "@mui/icons-material/BookmarkBorderRounded";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import FormatSizeRounded from "@mui/icons-material/FormatSizeRounded";
import OpenInNewRounded from "@mui/icons-material/OpenInNewRounded";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import {
  useCreateSacredTextAnnotationMutation,
  useDeleteSacredTextAnnotationMutation,
  useGetSacredPassageQuery,
  useGetSacredTextAnnotationsQuery,
  useGetSacredTextSectionQuery,
  useUpdateSacredTextAnnotationMutation,
  type SacredTextAnnotation,
  type SacredTextAnnotationInput,
} from "@/store/auraApi";
import { PathwayActivityApi, localActivityDate } from "@/features/pathways/pathwayActivityApi";
import { buildSacredTextBlocks, hashSacredTextAnchor, SacredTextAnnotationCanvas, selectedSacredTextRange } from "@/features/pathways/components/SacredTextAnnotationCanvas";
import type { SacredTextRange } from "@/features/pathways/components/SacredTextAnnotationCanvas";
import { SacredTextNotesPanel } from "@/features/pathways/components/SacredTextNotesPanel";
import "@recogito/react-text-annotator/react-text-annotator.css";
import "./sacredTextReader.css";

type Framework = SacredTextAnnotation["framework"];
type ReaderKind = SacredTextAnnotation["kind"];
type NoteEditor = { id?: number; range: SacredTextRange; value: string };

const supportedFrameworks = new Set<Framework>(["christian", "muslim", "jewish"]);

/** Opens only the profile-selected tradition and keeps source navigation inside Aura. */
export default function SacredTextReader() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const requestedFramework = user?.pathwayPreferences?.faithTradition;
  const framework = requestedFramework && supportedFrameworks.has(requestedFramework as Framework)
    ? requestedFramework as Framework : undefined;
  const queryReference = new URLSearchParams(location.search).get("reference") ?? "";
  const querySegment = new URLSearchParams(location.search).get("segment") ?? "";
  const dailyPassage = useGetSacredPassageQuery(framework ?? "christian", { skip: !framework });
  const [reference, setReference] = useState(queryReference);
  const [book, setBook] = useState("");
  const [chapter, setChapter] = useState("");
  const [fontSize, setFontSize] = useState(18);
  const [notesOpen, setNotesOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState("");
  const [noteEditor, setNoteEditor] = useState<NoteEditor | null>(null);
  const [reflection, setReflection] = useState("");
  const [reflectionMessage, setReflectionMessage] = useState("");
  const [savingReflection, setSavingReflection] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [mutationError, setMutationError] = useState("");
  const [unrestoredAnnotationCount, setUnrestoredAnnotationCount] = useState(0);
  const readerHeading = useRef<HTMLHeadingElement>(null);
  const activeFramework = framework ?? "christian";
  const sectionQuery = useGetSacredTextSectionQuery(
    { framework: activeFramework, reference },
    { skip: !framework || !reference },
  );
  const annotationsQuery = useGetSacredTextAnnotationsQuery(activeFramework, { skip: !framework });
  const [createAnnotation, createState] = useCreateSacredTextAnnotationMutation();
  const [updateAnnotation, updateState] = useUpdateSacredTextAnnotationMutation();
  const [deleteAnnotation, deleteState] = useDeleteSacredTextAnnotationMutation();
  const section = sectionQuery.currentData;
  const storedAnnotations = annotationsQuery.currentData ?? [];

  useEffect(() => {
    if (queryReference) setReference(queryReference);
  }, [queryReference]);

  useEffect(() => {
    const passage = dailyPassage.currentData;
    if (!reference && passage && passage.framework === framework) setReference(passage.reference);
  }, [dailyPassage.currentData, framework, reference]);

  useEffect(() => {
    if (!section) return;
    const parsed = splitReference(section.reference, framework);
    setBook(parsed.book);
    setChapter(parsed.chapter);
    setSelectedSegment(section.segments.find((segment) => querySegment && segment.reference === querySegment)?.reference
      ?? section.segments.find((segment) => queryReference && segment.reference.endsWith(queryReference.split(":").pop() ?? ""))?.reference
      ?? section.segments[0]?.reference ?? "");
    const targetSegment = querySegment && section.segments.some((segment) => segment.reference === querySegment) ? querySegment : "";
    readerHeading.current?.focus({ preventScroll: Boolean(targetSegment) });
    if (!targetSegment) return;
    // Opened from a note or journal link: bring the verse into view and outline it briefly.
    const frame = requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(`.sacred-reader-text [lang][data-reference="${CSS.escape(targetSegment)}"]`);
      if (!target) return;
      target.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      target.classList.add("sacred-reader-target");
      window.setTimeout(() => target.classList.remove("sacred-reader-target"), 2400);
    });
    return () => cancelAnimationFrame(frame);
  }, [framework, queryReference, querySegment, section]);

  const textBlocks = useMemo(() => section ? buildSacredTextBlocks(section) : [], [section]);
  const currentAnnotations = useMemo(() => section ? storedAnnotations.filter((item) =>
    item.sectionReference === section.reference && item.sourceVersion === section.sourceVersion) : [], [section, storedAnnotations]);
  const latestBookmark = storedAnnotations.find((item) => item.kind === "bookmark");
  /** Resets the section warning before its saved anchors are checked against the current source text. */
  useEffect(() => setUnrestoredAnnotationCount(0), [section?.reference, section?.sourceVersion]);
  const isLoading = Boolean(framework && (reference
    ? sectionQuery.isLoading || (sectionQuery.isFetching && !section)
    : dailyPassage.isLoading));

  const goToChapter = () => {
    const nextReference = framework === "muslim" ? `Qur’an ${chapter}` : `${book.trim()} ${chapter}`.trim();
    if (!chapter.trim() || (framework !== "muslim" && !book.trim())) return;
    setMutationError("");
    setReference(nextReference);
    const query = new URLSearchParams({ reference: nextReference });
    navigate(`/pathways/sacred-texts/reader?${query.toString()}`, { replace: true });
  };

  const stepChapter = (amount: number) => {
    const current = Number(chapter);
    const next = current + amount;
    if (!Number.isInteger(current) || next < 1 || (framework === "muslim" && next > 114)) return;
    const nextReference = framework === "muslim" ? `Qur’an ${next}` : `${book.trim()} ${next}`;
    setChapter(String(next));
    setReference(nextReference);
    navigate(`/pathways/sacred-texts/reader?${new URLSearchParams({ reference: nextReference }).toString()}`, { replace: true });
  };

  const findBlock = (start: number, end: number, segmentReference?: string, language?: string) => textBlocks.find((block) =>
    start >= block.start && end <= block.end
      && (!segmentReference || block.reference === segmentReference)
      && (!language || block.language === language));

  /** Converts Recogito's temporary section offsets to a segment anchor and hashes its cleaned display text. */
  const buildAnnotationInput = async (kind: ReaderKind, range: SacredTextRange, language: string, note?: string): Promise<SacredTextAnnotationInput | null> => {
    if (!framework || !section) return null;
    const block = findBlock(range.start, range.end, range.segmentReference, language);
    if (!block) return null;
    const startOffset = range.start - block.start;
    const endOffset = range.end - block.start;
    if (startOffset < 0 || endOffset < startOffset || (kind !== "bookmark" && endOffset === startOffset)) {
      setMutationError("Select a valid range within one text segment.");
      return null;
    }
    let anchorHash: string | null = null;
    if (kind !== "bookmark") {
      try {
        anchorHash = await hashSacredTextAnchor(block.text.slice(startOffset, endOffset));
      } catch {
        setMutationError("This browser can’t verify the selected text securely, so the annotation wasn’t saved.");
        return null;
      }
    }
    return {
      framework,
      sectionReference: section.reference,
      sourceVersion: section.sourceVersion,
      language,
      kind,
      startOffset,
      endOffset,
      segmentReference: block.reference,
      anchorHash,
      note: kind === "note" ? note : null,
    };
  };

  const saveSelectionAnnotation = async (annotation: TextAnnotation, kind: ReaderKind, note?: string) => {
    const selector = annotation.target.selector[0];
    if (!selector || selector.end <= selector.start) {
      setMutationError("Select a passage before saving an annotation.");
      return;
    }
    const block = findBlock(selector.start, selector.end);
    if (!block) {
      setMutationError("Keep a highlight or note within one text segment.");
      return;
    }
    const input = await buildAnnotationInput(kind, { start: selector.start, end: selector.end, segmentReference: block.reference }, block.language, note);
    if (!input) return;
    setMutationError("");
    try {
      await createAnnotation(input).unwrap();
      setActionMessage(kind === "highlight" ? "Highlight saved privately." : "Private note saved.");
    } catch {
      setMutationError("Couldn’t save this annotation. Your selected text is still here; try again.");
    }
  };

  const saveSegmentAnnotation = async () => {
    const target = textBlocks.find((block) => block.reference === selectedSegment && block.language === section?.textLanguage);
    if (!target) return;
    const range = { start: target.start, end: target.end, segmentReference: target.reference };
    const input = await buildAnnotationInput("highlight", range, target.language);
    if (!input) return;
    setMutationError("");
    try {
      await createAnnotation(input).unwrap();
      setActionMessage("Segment highlighted.");
    } catch {
      setMutationError("Couldn’t save this highlight. Try again.");
    }
  };

  const saveNote = async () => {
    if (!noteEditor || !noteEditor.value.trim()) return;
    if (noteEditor.id) {
      setMutationError("");
      try {
        await updateAnnotation({ id: noteEditor.id, body: { note: noteEditor.value.trim() } }).unwrap();
        setActionMessage("Note updated.");
        setNoteEditor(null);
      } catch {
        setMutationError("Couldn’t save this note. Your draft is still here; try again.");
      }
      return;
    }
    const block = findBlock(noteEditor.range.start, noteEditor.range.end);
    if (!block) {
      setMutationError("The note range no longer matches this text version.");
      return;
    }
    const input = await buildAnnotationInput("note", { ...noteEditor.range, segmentReference: block.reference }, block.language, noteEditor.value.trim());
    if (!input) return;
    setMutationError("");
    try {
      await createAnnotation(input).unwrap();
      setActionMessage("Private note saved.");
      setNoteEditor(null);
    } catch {
      setMutationError("Couldn’t save this note. Your draft is still here; try again.");
    }
  };

  const saveBookmark = async () => {
    const target = textBlocks.find((block) => block.reference === selectedSegment) ?? textBlocks[0];
    if (!target) return;
    const input = await buildAnnotationInput("bookmark", { start: target.start, end: target.start, segmentReference: target.reference }, target.language);
    if (!input) return;
    setMutationError("");
    try {
      await createAnnotation(input).unwrap();
      setActionMessage(`Bookmark saved at ${target.reference}.`);
    } catch {
      setMutationError("Couldn’t save the bookmark. Try again.");
    }
  };

  const editSavedNote = (annotation: SacredTextAnnotation) => setNoteEditor({
    id: annotation.id,
    range: { start: 0, end: 0, segmentReference: annotation.segmentReference ?? undefined },
    value: annotation.note ?? "",
  });

  /** Opens a saved note's passage: loads its section if needed, selects its verse, and scrolls to it. */
  const goToAnnotation = (annotation: SacredTextAnnotation) => {
    const params = new URLSearchParams({ reference: annotation.sectionReference });
    if (annotation.segmentReference) params.set("segment", annotation.segmentReference);
    setReference(annotation.sectionReference);
    setSelectedSegment(annotation.segmentReference ?? "");
    setNotesOpen(false);
    navigate(`/pathways/sacred-texts/reader?${params.toString()}`);
  };

  const removeAnnotation = async (annotation: SacredTextAnnotation | number) => {
    const annotationId = typeof annotation === "number" ? annotation : annotation.id;
    const kind = typeof annotation === "number" ? "annotation" : annotation.kind;
    setMutationError("");
    try {
      await deleteAnnotation(annotationId).unwrap();
      setActionMessage(kind === "bookmark" ? "Bookmark removed." : "Annotation removed.");
    } catch {
      setMutationError("Couldn’t remove this item. Try again.");
    }
  };

  const resumeBookmark = () => {
    if (!latestBookmark) return;
    setReference(latestBookmark.sectionReference);
    setSelectedSegment(latestBookmark.segmentReference ?? "");
    const params = new URLSearchParams({ reference: latestBookmark.sectionReference });
    if (latestBookmark.segmentReference) params.set("segment", latestBookmark.segmentReference);
    navigate(`/pathways/sacred-texts/reader?${params.toString()}`);
  };

  const copySelectedReference = async () => {
    if (!selectedSegment) return;
    try {
      await navigator.clipboard.writeText(selectedSegment);
      setActionMessage(`Copied ${selectedSegment}.`);
    } catch {
      setMutationError("Couldn’t copy the reference. You can still select it from the passage list.");
    }
  };

  const exportAnnotations = (format: "markdown" | "json", annotationIds?: number[]) => {
    const items = annotationIds ? storedAnnotations.filter((item) => annotationIds.includes(item.id)) : storedAnnotations;
    const content = format === "json"
      ? JSON.stringify(items.map((item) => ({
        id: item.id,
        kind: item.kind,
        sectionReference: item.sectionReference,
        sourceVersion: item.sourceVersion,
        language: item.language,
        segmentReference: item.segmentReference,
        note: item.note,
        createdAt: item.createdAt,
      })), null, 2)
      : items.map((item) => `## ${item.sectionReference}${item.segmentReference ? ` · ${item.segmentReference}` : ""}\n\n${item.note ? `${item.note}\n\n` : ""}_${item.kind === "highlight" ? "Highlighted passage" : item.kind === "bookmark" ? "Bookmark" : "Private note"} · ${item.sourceVersion}_`).join("\n\n---\n\n");
    downloadText(`aura-sacred-text-notes.${format === "json" ? "json" : "md"}`, content, format === "json" ? "application/json" : "text/markdown");
  };

  const saveReflection = async () => {
    const responseText = reflection.trim();
    if (!responseText || !section) return;
    setSavingReflection(true);
    setReflectionMessage("");
    try {
      await PathwayActivityApi.create({
        pathway: "faith",
        moduleKey: "sacred-texts",
        activityType: "pathway-reflection",
        occurredOn: localActivityDate(),
        // Keep the passage with the reflection so the journal can link back to it.
        content: {
          insightType: "reader-reflection",
          prompt: `As you read ${section.reference}, what stands out to you?`,
          responseText,
          reference: section.reference,
          ...(selectedSegment ? { segment: selectedSegment } : {}),
        },
      });
      setReflection("");
      setReflectionMessage("Saved to your journal.");
    } catch {
      setReflectionMessage("Couldn’t save your response. Try again.");
    } finally {
      setSavingReflection(false);
    }
  };

  if (!framework) return <Box className="signed-in-content" sx={{ maxWidth: 760, mx: "auto", py: 3 }}>
    <Button component={Link} to="/pathways/sacred-texts" variant="plain" startDecorator={<ArrowBackRounded />}>Back to Faith &amp; Religion</Button>
    <Typography component="h1" level="h1" sx={{ mt: 2 }}>Sacred text reader</Typography>
    <Typography role="status" level="body-md" sx={{ mt: 1 }}>Choose a supported framework in Profile settings to open its reading in Aura.</Typography>
  </Box>;

  return <>
    {framework === "muslim" && <meta name="google" content="notranslate" />}
    <Box className="signed-in-content sacred-text-reader" sx={{ maxWidth: 1180, mx: "auto", pb: 4 }}>
    <Box component="header" sx={{ mb: 2.5 }}>
      <Button component={Link} to="/pathways/sacred-texts" size="sm" variant="plain" startDecorator={<ArrowBackRounded />}>Back to Faith &amp; Religion</Button>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mt: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h1" level="h1" ref={readerHeading} tabIndex={-1} sx={{ fontFamily: "var(--joy-fontFamily-display)", fontWeight: 500, outline: "none" }}>
            {section?.reference ?? "Sacred text reader"}
          </Typography>
          <Typography level="body-sm" sx={{ mt: .5, color: "var(--al-theme-ink-muted)" }}>
            {section ? `${frameworkLabel(framework)} · ${section.translation}` : "Open your selected reading inside Aura."}
          </Typography>
        </Box>
        <Box className="sacred-reader-prism" aria-hidden="true"><span /><span /><span /></Box>
      </Box>
    </Box>

    <Box component="section" aria-label="Reader navigation and controls" className="sacred-reader-toolbar">
      <Box className="sacred-reader-navigation">
        {framework === "muslim" ? <FormControl size="sm" sx={{ minWidth: 140 }}>
          <FormLabel>Surah number</FormLabel><Input type="number" value={chapter} slotProps={{ input: { min: 1, max: 114 } }} onChange={(event) => setChapter(event.target.value)} />
        </FormControl> : <>
          {/* A searchable list of canonical names, not free text: providers match books by exact name, so typos like "Proverb" failed. */}
          <FormControl size="sm" sx={{ minWidth: 160, flex: 1 }}><FormLabel>Book or work</FormLabel><Autocomplete
            options={sacredTextBookOptions(framework === "jewish" ? "jewish" : "christian", book)}
            value={book || null}
            onChange={(_event, value) => { setBook(value ?? ""); if (value && value !== book) setChapter("1"); }}
            placeholder={framework === "jewish" ? "Choose a book, e.g. Psalms" : "Choose a book, e.g. John"}
            autoHighlight
            disableClearable={!!book}
          /></FormControl>
          <FormControl size="sm" sx={{ width: 112 }}><FormLabel>Chapter</FormLabel><Input type="number" value={chapter} slotProps={{ input: { min: 1 } }} onChange={(event) => setChapter(event.target.value)} /></FormControl>
        </>}
        <Button size="sm" variant="soft" onClick={goToChapter} disabled={!chapter || (framework !== "muslim" && !book.trim())}>Open section</Button>
        <Button size="sm" variant="plain" aria-label="Previous chapter" disabled={!chapter || Number(chapter) <= 1} onClick={() => stepChapter(-1)}><ChevronLeftRounded /> Previous</Button>
        <Button size="sm" variant="plain" aria-label="Next chapter" disabled={framework === "muslim" && Number(chapter) >= 114} onClick={() => stepChapter(1)}>Next <ChevronRightRounded /></Button>
      </Box>
      <Box className="sacred-reader-display-controls" aria-label="Text display controls">
        <FormatSizeRounded aria-hidden="true" />
        <Button size="sm" variant="plain" aria-label="Decrease text size" disabled={fontSize <= 16} onClick={() => setFontSize((size) => Math.max(16, size - 2))}>A−</Button>
        <Button size="sm" variant="plain" aria-label="Increase text size" disabled={fontSize >= 26} onClick={() => setFontSize((size) => Math.min(26, size + 2))}>A+</Button>
        <Button size="sm" variant="soft" startDecorator={<BookmarkBorderRounded />} onClick={() => void saveBookmark()}>Bookmark position</Button>
      </Box>
    </Box>

    {latestBookmark && <Box className="sacred-reader-resume" role="region" aria-label="Saved reading position">
      <Typography level="body-sm">Saved place: {latestBookmark.sectionReference}{latestBookmark.segmentReference ? ` · ${latestBookmark.segmentReference}` : ""}</Typography>
      <Button size="sm" variant="plain" onClick={resumeBookmark}>Resume</Button>
    </Box>}

    {isLoading && <Box role="status" sx={{ display: "flex", alignItems: "center", gap: 1, py: 5 }}><CircularProgress size="sm" />Opening your reading…</Box>}
    {(dailyPassage.isError || (dailyPassage.isSuccess && !reference)) && <Alert color="warning" variant="soft" sx={{ mt: 2 }}>
      Today’s passage is unavailable. You can still open a section using the controls above.
      <Button size="sm" variant="plain" onClick={() => void dailyPassage.refetch()}>Try again</Button>
    </Alert>}
    {sectionQuery.isError && <Alert color="warning" variant="soft" sx={{ mt: 2 }}>
      <Box><Typography level="title-sm">This section is unavailable right now.</Typography><Typography level="body-sm">Your selected framework and saved notes are unchanged.</Typography></Box>
      <Button size="sm" variant="plain" onClick={() => void sectionQuery.refetch()}>Try again</Button>
    </Alert>}

    {section && <>
      <Box className="sacred-reader-source" component="section" aria-label="Text source and attribution">
        <Typography level="body-xs">{section.attribution}</Typography>
        <Button component="a" href={section.readingUrl} target="_blank" rel="noreferrer" size="sm" variant="plain" endDecorator={<OpenInNewRounded />}>Publisher source</Button>
        {/* Use only the license deed URL returned with this exact Sefaria version. */}
        {section.sourceLicenseUrl && <Button component="a" href={section.sourceLicenseUrl} target="_blank" rel="noreferrer" size="sm" variant="plain" endDecorator={<OpenInNewRounded />}>Hebrew source license</Button>}
      </Box>
      {mutationError && <Alert role="alert" color="danger" variant="soft" sx={{ mt: 1.5 }}>{mutationError}</Alert>}
      {unrestoredAnnotationCount > 0 && <Alert role="status" color="warning" variant="soft" sx={{ mt: 1.5 }}>
        {unrestoredAnnotationCount} saved {unrestoredAnnotationCount === 1 ? "highlight or note was" : "highlights or notes were"} kept in your private notes but not placed on the text because the anchor could not be verified against this wording.
      </Alert>}
      {actionMessage && <Typography role="status" aria-live="polite" level="body-xs" sx={{ mt: 1, color: "var(--al-theme-ink-muted)" }}>{actionMessage}</Typography>}
      {annotationsQuery.isError && <Alert color="warning" variant="soft" sx={{ mt: 1.5 }}>Your private annotations couldn’t be loaded. The reading remains available.</Alert>}

      <Box className="sacred-reader-columns">
        <Box component="article" aria-label={`${section.reference} text`} className="sacred-reader-reading-surface" sx={{ "--sacred-reader-font-size": `${fontSize}px` } as CSSProperties}>
          <Box className="sacred-reader-reading-toolbar">
            <FormControl size="sm" sx={{ minWidth: 0, flex: 1 }}>
              <FormLabel>Choose a verse or segment for keyboard actions</FormLabel>
              <Select value={selectedSegment || ""} onChange={(_event, value) => setSelectedSegment(value ?? "")} placeholder="Choose a segment">
                {section.segments.map((segment) => <Option key={segment.reference} value={segment.reference}>{segment.reference}</Option>)}
              </Select>
            </FormControl>
          </Box>

          <SacredTextAnnotationCanvas
            section={section}
            annotations={currentAnnotations}
            blocks={textBlocks}
            onAnchorsSkipped={setUnrestoredAnnotationCount}
            onHighlight={(annotation) => void saveSelectionAnnotation(annotation, "highlight")}
            onAddNote={(range) => setNoteEditor({ range, value: "" })}
            onRemove={(id) => void removeAnnotation(id)}
            onEditNote={(id, range, value) => setNoteEditor({ id, range, value })}
          />
          <Box className="sacred-reader-segment-actions" aria-label="Selected segment actions">
            <Button size="sm" variant="plain" onClick={() => void saveSegmentAnnotation()} disabled={!selectedSegment}>Highlight selected segment</Button>
            <Button size="sm" variant="plain" onClick={() => setNoteEditor({ range: selectedSacredTextRange(textBlocks, selectedSegment), value: "" })} disabled={!selectedSegment}>Add private note</Button>
            <Button size="sm" variant="plain" onClick={() => void copySelectedReference()} disabled={!selectedSegment}>Copy reference</Button>
          </Box>

          <Box className="sacred-reader-chapter-footer">
            <Button size="sm" variant="plain" disabled={!chapter || Number(chapter) <= 1} startDecorator={<ChevronLeftRounded />} onClick={() => stepChapter(-1)}>Previous section</Button>
            <Button size="sm" variant="plain" disabled={framework === "muslim" && Number(chapter) >= 114} endDecorator={<ChevronRightRounded />} onClick={() => stepChapter(1)}>Next section</Button>
          </Box>
          <Box component="details" className="sacred-reader-reflection">
            <Box component="summary">Add a reflection to your journal</Box>
            <Typography level="body-sm" sx={{ mt: 1 }}>What stands out to you about {section.reference}?</Typography>
            <Textarea aria-label="Your reflection" value={reflection} onChange={(event) => setReflection(event.target.value)} minRows={3} maxRows={8} slotProps={{ textarea: { maxLength: 2000 } }} sx={{ mt: 1 }} />
            <Button size="sm" variant="soft" disabled={!reflection.trim() || savingReflection} onClick={() => void saveReflection()} sx={{ mt: 1 }}>Save to journal</Button>
            {reflectionMessage && <Typography role="status" level="body-xs" sx={{ mt: .5 }}>{reflectionMessage}</Typography>}
          </Box>
        </Box>

        <SacredTextNotesPanel
          annotations={currentAnnotations}
          isSaving={createState.isLoading || updateState.isLoading}
          isDeleting={deleteState.isLoading}
          isOpen={notesOpen}
          onExport={exportAnnotations}
          onPrint={() => window.print()}
          onEdit={editSavedNote}
          onGoTo={goToAnnotation}
          onDelete={(annotation) => void removeAnnotation(annotation)}
          onToggle={() => setNotesOpen((open) => !open)}
        />
      </Box>
    </>}

    <Modal open={Boolean(noteEditor)} onClose={() => setNoteEditor(null)}>
      <ModalDialog aria-labelledby="reader-note-dialog-title" sx={{ width: "min(520px, calc(100vw - 32px))" }}>
        <DialogTitle id="reader-note-dialog-title">{noteEditor?.id ? "Edit private note" : "Add a private note"}</DialogTitle>
        <DialogContent>{noteEditor?.range.segmentReference} · Only you can see this note.</DialogContent>
        <Textarea autoFocus aria-label="Private note" value={noteEditor?.value ?? ""} onChange={(event) => setNoteEditor((current) => current ? { ...current, value: event.target.value } : current)} minRows={4} maxRows={10} slotProps={{ textarea: { maxLength: 2000 } }} />
        {mutationError && <Alert role="alert" color="danger" variant="soft">{mutationError}</Alert>}
        <DialogActions>
          <Button variant="plain" onClick={() => setNoteEditor(null)}>Cancel</Button>
          <Button disabled={!noteEditor?.value.trim() || createState.isLoading || updateState.isLoading} onClick={() => void saveNote()}>Save note</Button>
        </DialogActions>
      </ModalDialog>
    </Modal>
    </Box>
  </>;

}

function splitReference(reference: string, framework: Framework | undefined): { book: string; chapter: string } {
  if (framework === "muslim") {
    const match = reference.match(/(\d{1,3})/);
    return { book: "", chapter: match?.[1] ?? "1" };
  }
  const match = reference.match(/^(.+?)\s+(\d{1,3})(?:[:.]\d+.*)?$/);
  return match ? { book: match[1], chapter: match[2] } : { book: reference, chapter: "1" };
}

function frameworkLabel(framework: Framework): string {
  return framework === "christian" ? "Bible" : framework === "muslim" ? "Qur’an" : "Jewish texts";
}

function downloadText(filename: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
