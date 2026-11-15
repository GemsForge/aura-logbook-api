import { Component, Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Annotorious, useAnnotator } from "@annotorious/react";
import { TextAnnotator, TextAnnotationPopup } from "@recogito/react-text-annotator";
import type { TextAnnotation, RecogitoTextAnnotator } from "@recogito/react-text-annotator";
import { Box, Button, Typography } from "@mui/joy";
import type { SacredTextAnnotation, SacredTextSection } from "@/store/auraApi";

/** A language-specific text run with offsets in the complete visible section. */
export type SacredTextBlock = {
  reference: string;
  text: string;
  language: string;
  direction: "ltr" | "rtl";
  start: number;
  end: number;
};

/** Section-relative offsets accepted by the owner-scoped annotation API. */
export type SacredTextRange = { start: number; end: number; segmentReference?: string };

/** Builds the annotated reading surface and bridges Recogito selections to Aura's private-note actions. */
export function SacredTextAnnotationCanvas({
  section,
  annotations,
  blocks,
  text,
  onHighlight,
  onAddNote,
  onRemove,
  onEditNote,
}: {
  section: SacredTextSection;
  annotations: SacredTextAnnotation[];
  blocks: SacredTextBlock[];
  text: string;
  onHighlight(annotation: TextAnnotation): void;
  onAddNote(range: SacredTextRange): void;
  onRemove(id: number): void;
  onEditNote(id: number, range: SacredTextRange, value: string): void;
}) {
  const themeRoot = useRef<HTMLDivElement>(null);
  const highlightColor = useThemeHighlightColor(themeRoot);
  return <SacredTextAnnotationBoundary blocks={blocks}>
  <div ref={themeRoot} style={{ display: "contents" }}>
  <Annotorious>
    <TextAnnotator className="sacred-reader-annotation-root" style={{
      // Recogito paints highlights itself (page CSS does not reach them), so pass a concrete theme color.
      // A strong fill plus a solid underline keeps saved marks visible on dark/night-mode screens.
      fill: highlightColor, fillOpacity: 0.45, underlineColor: highlightColor, underlineThickness: 2, underlineOffset: 2,
    }}>
      <div className="sacred-reader-text" aria-label="Select text to highlight or annotate">
        {blocks.map((block, index) => <Fragment key={`${block.reference}-${block.language}`}>
          {index > 0 ? "\n\n" : null}
          {(index === 0 || blocks[index - 1].reference !== block.reference) && <span className="sacred-reader-segment-reference" role="group" aria-label={`Reference ${block.reference}`} data-reference={block.reference} />}
          <span lang={block.language} dir={block.direction} translate={section.framework === "muslim" ? "no" : undefined} data-reference={block.reference}>{block.text}</span>
        </Fragment>)}
      </div>
      <TextAnnotationPopup asPortal popup={({ annotation }) => <SelectionActions
        annotation={annotation}
        onHighlight={() => onHighlight(annotation)}
        onAddNote={() => onAddNote(getAnnotationRange(annotation))}
        onRemove={() => onRemove(Number(annotation.properties?.serverId))}
        onEditNote={(id, range, value) => onEditNote(id, range, value)}
      />} />
    </TextAnnotator>
    <SavedAnnotationsLayer section={section} annotations={annotations} text={text} />
  </Annotorious>
  </div>
  </SacredTextAnnotationBoundary>;
}

/** Fallback when no theme focus color is available (matches the light theme's sage primary). */
const DEFAULT_HIGHLIGHT_COLOR = "#668879";

/**
 * Resolves the active theme's focus color (`--al-theme-focus`) as a concrete value for Recogito's
 * highlight renderer, which cannot read CSS variables. Every theme tunes its focus color to stand out
 * from its canvas in light and dark modes. Re-reads after each render so theme switches apply.
 */
function useThemeHighlightColor(root: React.RefObject<HTMLElement | null>): string {
  const [color, setColor] = useState(DEFAULT_HIGHLIGHT_COLOR);
  useLayoutEffect(() => {
    const element = root.current?.parentElement ?? document.documentElement;
    const next = getComputedStyle(element).getPropertyValue("--al-theme-focus").trim() || DEFAULT_HIGHLIGHT_COLOR;
    if (next !== color) setColor(next);
  });
  return color;
}

/**
 * Keeps the reader usable when the annotation layer fails: the error is logged and the
 * section text is shown as plain, readable text instead of the router's crash screen.
 */
class SacredTextAnnotationBoundary extends Component<{ blocks: SacredTextBlock[]; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Sacred text annotation layer failed", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return <Box className="sacred-reader-text" role="region" aria-label="Section text">
      <Typography level="body-sm" role="status" sx={{ mb: 1 }}>Highlights and notes are unavailable right now. You can keep reading.</Typography>
      {this.props.blocks.map((block, index) => <Fragment key={`${block.reference}-${block.language}`}>
        {index > 0 ? "\n\n" : null}
        <span lang={block.language} dir={block.direction} data-reference={block.reference}>{block.text}</span>
      </Fragment>)}
    </Box>;
  }
}

/** Saves or edits selected-text actions with an accessible, touch-friendly popup. */
function SelectionActions({
  annotation,
  onHighlight,
  onAddNote,
  onRemove,
  onEditNote,
}: {
  annotation: TextAnnotation;
  onHighlight(): void;
  onAddNote(): void;
  onRemove(): void;
  onEditNote(id: number, range: SacredTextRange, value: string): void;
}) {
  // May be null until Recogito mounts; Dismiss is a no-op until then.
  const annotator = useAnnotator<RecogitoTextAnnotator>();
  const serverId = Number(annotation.properties?.serverId);
  const range = getAnnotationRange(annotation);
  const existingNote = annotation.bodies.find((body) => body.purpose === "commenting")?.value ?? "";
  return <Box className="sacred-reader-selection-popup" role="group" aria-label="Selected text actions">
    {Number.isInteger(serverId) && serverId > 0 ? <>
      {annotation.properties?.kind === "note" && <Button size="sm" onClick={() => onEditNote(serverId, range, existingNote)}>Edit note</Button>}
      <Button size="sm" color="danger" variant="plain" onClick={onRemove}>Remove</Button>
    </> : <>
      <Button size="sm" onClick={onHighlight}>Highlight</Button>
      <Button size="sm" variant="soft" onClick={onAddNote}>Add note</Button>
      <Button size="sm" variant="plain" onClick={() => annotator?.removeAnnotation(annotation.id)}>Dismiss</Button>
    </>}
  </Box>;
}

/** Hydrates only exact section/version anchors; offsets are resolved against the provider's current text. */
function SavedAnnotationsLayer({ section, annotations, text }: { section: SacredTextSection; annotations: SacredTextAnnotation[]; text: string }) {
  const annotator = useAnnotator<RecogitoTextAnnotator>();
  useEffect(() => {
    // The Recogito annotator is created after the first render (and StrictMode re-runs this
    // effect before it exists); wait for it — this effect re-runs once `annotator` is set.
    if (!annotator) return;
    const saved: TextAnnotation[] = annotations.filter((item) => item.kind !== "bookmark" && item.endOffset <= text.length && item.startOffset < item.endOffset)
      .map((item) => {
        const id = String(item.id);
        return {
          id,
          target: { annotation: id, selector: [{ start: item.startOffset, end: item.endOffset, quote: text.slice(item.startOffset, item.endOffset) }] },
          bodies: [{ id: `${id}-body`, annotation: id, purpose: item.kind === "highlight" ? "highlighting" : "commenting", value: item.note ?? "" }],
          properties: { serverId: item.id, kind: item.kind, segmentReference: item.segmentReference, language: item.language },
        };
      });
    annotator.setAnnotations(saved);
  }, [annotator, annotations, section.reference, section.sourceVersion, text]);
  return null;
}

/** Computes one selected range and its segment association for notes and persistence. */
function getAnnotationRange(annotation: TextAnnotation): SacredTextRange {
  const selector = annotation.target.selector[0];
  return { start: selector?.start ?? 0, end: selector?.end ?? 0, segmentReference: annotation.properties?.segmentReference };
}

/** Builds exact UTF-16 offsets across provider source/translation blocks and their visible separators. */
export function buildSacredTextBlocks(section: SacredTextSection): SacredTextBlock[] {
  const blocks: Array<Omit<SacredTextBlock, "start" | "end">> = [];
  for (const segment of section.segments) {
    if (segment.sourceText && section.sourceLanguage && section.sourceDirection)
      blocks.push({ reference: segment.reference, text: segment.sourceText, language: section.sourceLanguage, direction: section.sourceDirection });
    blocks.push({ reference: segment.reference, text: segment.text, language: section.textLanguage, direction: section.textDirection });
  }
  let offset = 0;
  return blocks.map((block, index) => {
    const start = offset + (index > 0 ? 2 : 0);
    const end = start + block.text.length;
    offset = end;
    return { ...block, start, end };
  });
}

/** Picks the translated run for touch/keyboard segment actions when one exists. */
export function selectedSacredTextRange(blocks: SacredTextBlock[], reference: string): SacredTextRange {
  const block = blocks.find((item) => item.reference === reference && item.direction === "ltr") ?? blocks.find((item) => item.reference === reference);
  return { start: block?.start ?? 0, end: block?.end ?? 0, segmentReference: block?.reference };
}
