import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/testUtilities";
import { PhotoViewer } from "./MomentStrip";
import { MoodMediaApi, type MoodMediaAttachment } from "@/api/MoodMediaApi";

vi.mock("@/api/MoodMediaApi", () => ({ MoodMediaApi: { getContent: vi.fn() } }));

const photo = (id: string): MoodMediaAttachment => ({ id, fileName: `${id}.jpg` }) as MoodMediaAttachment;
const photos = [photo("first"), photo("second"), photo("third")];

/**
 * Hosts the Reflection photo viewer (#378) with real state, so navigation is observed the way a
 * reader sees it: the position text and image alt change as the current photo changes.
 */
function Harness({ items = photos, start = 0 }: { items?: MoodMediaAttachment[]; start?: number }) {
  const [current, setCurrent] = useState(items[start]);
  return <PhotoViewer entryId={7} photos={items} photo={current} onPhotoChange={setCurrent} onClose={() => undefined} />;
}

const position = () => screen.getByText(/\d of \d/).textContent;
/** Swipes on the touch surface that wraps the loaded image; small vertical drift is allowed. */
const swipe = (fromX: number, toX: number) => {
  const target = screen.getByAltText(/\.jpg$/).parentElement!;
  fireEvent.touchStart(target, { touches: [{ clientX: fromX, clientY: 100 }] });
  fireEvent.touchEnd(target, { changedTouches: [{ clientX: toX, clientY: 104 }] });
};

describe("Reflection PhotoViewer navigation (#378)", () => {
  beforeEach(() => {
    vi.mocked(MoodMediaApi.getContent).mockResolvedValue(new Blob(["x"], { type: "image/jpeg" }));
    globalThis.URL.createObjectURL = vi.fn(() => "blob:photo");
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it("moves with the visible buttons and announces the position", async () => {
    renderWithProviders(<Harness />);
    expect(position()).toBe("1 of 3");
    expect(screen.getByText("1 of 3")).toHaveAttribute("aria-live", "polite");

    fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
    expect(position()).toBe("2 of 3");
    fireEvent.click(screen.getByRole("button", { name: "Previous photo" }));
    expect(position()).toBe("1 of 3");
  });

  it("disables the controls at the first and last photo", () => {
    renderWithProviders(<Harness />);
    expect(screen.getByRole("button", { name: "Previous photo" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next photo" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
    fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
    expect(position()).toBe("3 of 3");
    expect(screen.getByRole("button", { name: "Next photo" })).toBeDisabled();
  });

  it("moves with left and right arrow keys and stays within the entry's photos", () => {
    renderWithProviders(<Harness />);
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(position()).toBe("1 of 3");

    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(position()).toBe("3 of 3");

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(position()).toBe("2 of 3");
  });

  it("moves with horizontal swipes and ignores short ones", async () => {
    renderWithProviders(<Harness />);
    await screen.findByAltText("first.jpg");

    swipe(200, 180); // under the 48px threshold
    expect(position()).toBe("1 of 3");
    swipe(200, 100); // swipe left → next
    expect(position()).toBe("2 of 3");
    swipe(100, 200); // swipe right → previous
    expect(position()).toBe("1 of 3");
  });

  it("hides navigation for a single photo", () => {
    renderWithProviders(<Harness items={[photo("only")]} />);
    expect(screen.queryByRole("group", { name: "Photo navigation" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Next photo" })).toBeNull();
  });
});
