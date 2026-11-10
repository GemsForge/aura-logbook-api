import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode, FormEvent } from "react";
import { renderWithProviders } from "../test/testUtilities";
import MoodUpdateModal from "./MoodUpdateModal";

const apiMocks = vi.hoisted(() => ({ updateMood: vi.fn(), upload: vi.fn(), showToast: vi.fn() }));

vi.mock("../api/MoodApi", () => ({ MoodApi: { updateMood: apiMocks.updateMood } }));
vi.mock("../api/MoodMediaApi", () => ({ MoodMediaApi: { upload: apiMocks.upload } }));
vi.mock("../hooks/useToast", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../hooks/useToast")>()),
  useToast: () => ({ showToast: apiMocks.showToast }),
}));
vi.mock("./ui/AuraModal", () => ({
  AuraModal: ({ open, title, children, actions }: { open: boolean; title: string; children: ReactNode; actions: ReactNode }) =>
    open ? <section><h1>{title}</h1>{children}{actions}</section> : null,
}));
vi.mock("./MoodEntryFormFields", () => ({
  default: ({ onSubmit, statusMessage, statusRole, photoStatuses }: {
    onSubmit: (data: { date: string; moods: ["Centered"]; comment: string }, photos: File[]) => Promise<void>;
    disabled: boolean;
    statusMessage?: string;
    statusRole?: "alert" | "status";
    photoStatuses: string[];
  }) => <form id="mood-form" onSubmit={(event: FormEvent) => { event.preventDefault(); void onSubmit({ date: "2026-11-10", moods: ["Centered"], comment: "A note" }, [new File(["photo"], "moment.jpg", { type: "image/jpeg" })]); }}>
    {statusMessage && <p role={statusRole}>{statusMessage}</p>}
    <output>{photoStatuses.join(",")}</output>
  </form>,
}));

describe("MoodUpdateModal", () => {
  beforeEach(() => {
    apiMocks.updateMood.mockReset().mockResolvedValue("Updated");
    apiMocks.upload.mockReset().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ id: "photo-1" });
    apiMocks.showToast.mockReset();
  });

  it("retries only the private photo for the same saved mood entry", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    renderWithProviders(
      <MoodUpdateModal
        entry={{ id: 123, userId: 9, date: "2026-11-10", moods: ["Centered"], comment: "", createdAt: "2026-11-10T10:00:00Z" }}
        title="Add a note or photo"
        saveLabel="Save details"
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Save details" }));
    await user.click(screen.getByRole("button", { name: "Retry failed photos" }));

    expect(apiMocks.updateMood).toHaveBeenCalledTimes(1);
    expect(apiMocks.updateMood).toHaveBeenCalledWith(123, expect.objectContaining({ moods: ["Centered"], comment: "A note" }));
    expect(apiMocks.upload).toHaveBeenCalledTimes(2);
    expect(apiMocks.upload).toHaveBeenNthCalledWith(1, 123, expect.any(File));
    expect(apiMocks.upload).toHaveBeenNthCalledWith(2, 123, expect.any(File));
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
