import { StrictMode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SacredTextAnnotation, SacredTextSection } from "@/store/auraApi";
const mocks = vi.hoisted(() => ({ annotator: null as null | { setAnnotations: ReturnType<typeof vi.fn> }, throwText: false }));

// Recogito/Annotorious pull in browser-only CommonJS deps; a pass-through mock reproduces the
// pre-mount state where useAnnotator() is still null (the #414 crash) without loading them.
vi.mock("@annotorious/react", () => ({
  Annotorious: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAnnotator: () => mocks.annotator,
}));
vi.mock("@recogito/react-text-annotator", () => ({
  TextAnnotator: ({ children }: { children: React.ReactNode }) => {
    if (mocks.throwText) throw new Error("annotator failed");
    return <>{children}</>;
  },
  TextAnnotationPopup: () => null,
}));

import { buildSacredTextBlocks, SacredTextAnnotationCanvas } from "./SacredTextAnnotationCanvas";

/** Regression coverage for #414: the reader must not crash before Recogito's annotator exists. */
const section = {
  framework: "christian", reference: "Psalm 23", sourceVersion: "WEB",
  textLanguage: "en", textDirection: "ltr",
  segments: [{ reference: "Psalm 23:1", text: "Yahweh is my shepherd: I shall lack nothing." }],
} as unknown as SacredTextSection;
const annotations = [
  { id: 7, kind: "highlight", startOffset: 0, endOffset: 6, segmentReference: "Psalm 23:1", language: "en" },
] as unknown as SacredTextAnnotation[];

const renderCanvas = () => {
  const blocks = buildSacredTextBlocks(section);
  return render(<StrictMode>
    <SacredTextAnnotationCanvas section={section} annotations={annotations} blocks={blocks} text={blocks.map((b) => b.text).join("\n\n")}
      onHighlight={vi.fn()} onAddNote={vi.fn()} onRemove={vi.fn()} onEditNote={vi.fn()} />
  </StrictMode>);
};

describe("SacredTextAnnotationCanvas", () => {
  beforeEach(() => { mocks.annotator = null; mocks.throwText = false; });

  it("loads in StrictMode with saved annotations without throwing", () => {
    expect(renderCanvas).not.toThrow();
    expect(screen.getByText(/Yahweh is my shepherd/)).toBeTruthy();
  });

  it("hydrates saved annotations once the annotator is ready", () => {
    mocks.annotator = { setAnnotations: vi.fn() };
    renderCanvas();
    expect(mocks.annotator.setAnnotations).toHaveBeenCalledWith([expect.objectContaining({ id: "7" })]);
  });

  it("shows readable text instead of crashing when the annotation layer fails", () => {
    mocks.throwText = true;
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    renderCanvas();
    expect(screen.getByRole("status").textContent).toMatch(/keep reading/);
    expect(screen.getByText(/Yahweh is my shepherd/)).toBeTruthy();
    error.mockRestore();
  });
});
