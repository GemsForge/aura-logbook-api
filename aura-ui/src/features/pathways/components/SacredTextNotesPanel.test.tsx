import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SacredTextAnnotation } from "@/store/auraApi";
import { SacredTextNotesPanel } from "./SacredTextNotesPanel";

/** Each saved note can take the reader back to the verse it was written on. */
describe("SacredTextNotesPanel", () => {
  it("opens the passage a note was saved on", () => {
    const note = { id: 3, kind: "note", sectionReference: "Proverbs 3", segmentReference: "Proverbs 3:5", note: "Trust", sourceVersion: "WEB" } as SacredTextAnnotation;
    const onGoTo = vi.fn();
    render(<SacredTextNotesPanel annotations={[note]} isSaving={false} isDeleting={false} isOpen onExport={vi.fn()} onPrint={vi.fn()} onEdit={vi.fn()} onGoTo={onGoTo} onDelete={vi.fn()} onToggle={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Go to passage" }));
    expect(onGoTo).toHaveBeenCalledWith(note);
  });
});
