import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/testUtilities";
import MoodPhotoPicker from "./MoodPhotoPicker";

vi.mock("@/features/mood/utils/prepareMoodPhoto", () => ({
  prepareMoodPhoto: vi.fn(async (file: File) => file),
}));

describe("MoodPhotoPicker", () => {
  it("prepares previews, reports filenames, and removes a selected photo", async () => {
    const onChange = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:private-preview") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    renderWithProviders(<MoodPhotoPicker onChange={onChange} />);

    const photo = new File(["jpeg"], "today.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText("Choose mood photos"), { target: { files: [photo] } });

    expect(await screen.findByRole("img", { name: "Preview of today.jpg" })).toHaveAttribute("src", "blob:private-preview");
    expect(screen.getByText("today.jpg")).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith([photo]);

    fireEvent.click(screen.getByRole("button", { name: "Remove today.jpg" }));

    await waitFor(() => expect(screen.queryByRole("img", { name: "Preview of today.jpg" })).not.toBeInTheDocument());
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:private-preview");
  });

  it("limits one mood entry to ten prepared photos", async () => {
    renderWithProviders(<MoodPhotoPicker onChange={vi.fn()} />);
    const photos = Array.from({ length: 11 }, (_, index) => new File(["jpeg"], `photo-${index}.jpg`, { type: "image/jpeg" }));
    fireEvent.change(screen.getByLabelText("Choose mood photos"), { target: { files: photos } });

    expect(await screen.findByRole("alert")).toHaveTextContent("up to 10 photos");
    expect(await screen.findAllByRole("img")).toHaveLength(10);
  });
});
