import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLocation } from "react-router-dom";
import { renderWithProviders } from "../../test/testUtilities";
import MoodEntryForm from "@/components/MoodEntryForm";

const flow = vi.hoisted(() => ({
  logMood: vi.fn(),
  upload: vi.fn(),
  showToast: vi.fn(),
  photos: [] as File[],
}));

function CurrentPath() {
  return <output aria-label="Current path">{useLocation().pathname}</output>;
}

vi.mock("../../hooks/useToast", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../hooks/useToast")>();

  return {
    ...actual,
    useToast: () => ({
      showToast: flow.showToast,
    }),
  };
});

// Weather attached to check-ins comes from the cached weather query; stub it so the store module graph stays out of this test.
vi.mock("@/store/weatherApi", () => ({ useGetCurrentWeatherQuery: () => ({ data: undefined }) }));
vi.mock("@/api/MoodApi", () => ({ MoodApi: { logMood: flow.logMood } }));
vi.mock("@/api/MoodMediaApi", () => ({ MoodMediaApi: { upload: flow.upload } }));

vi.mock("@/components/MoodEntryFormFields", () => ({
  default: ({ onSubmit, isSubmitting, submitLabel, statusMessage, statusRole }: {
    onSubmit: (data: { date: string; moods: string[]; comment: string }, photos: File[]) => Promise<void>;
    isSubmitting?: boolean;
    submitLabel?: string;
    statusMessage?: string;
    statusRole?: "alert" | "status";
  }) => (
    <div data-testid="mood-entry-form-fields">
      <button type="button" disabled={isSubmitting} onClick={() => void onSubmit({ date: "2026-11-10", moods: ["Centered"], comment: "Remember this." }, flow.photos)}>{submitLabel ?? "Save mood"}</button>
      {statusMessage && <p role={statusRole}>{statusMessage}</p>}
    </div>
  ),
}));

describe("MoodEntryForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    flow.photos = [
      new File(["first"], "first.jpg", { type: "image/jpeg" }),
      new File(["second"], "second.jpg", { type: "image/jpeg" }),
    ];
    flow.logMood.mockResolvedValue({ id: 42, message: "Mood entry recorded." });
    flow.upload.mockResolvedValue({ id: "private-attachment" });
  });

  /**
   * Verifies that the MoodEntryForm renders the page heading and delegates
   * the actual form controls to the MoodEntryFormFields child component.
   */
  it("should render the mood entry form", () => {
    renderWithProviders(<MoodEntryForm />);

    expect(
      screen.getByRole("heading", { name: /how are you feeling today/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save mood" })).toBeInTheDocument();
  });

  it("creates the mood once, then uploads each selected photo to its new private entry", async () => {
    renderWithProviders(<><MoodEntryForm /><CurrentPath /></>);

    fireEvent.click(screen.getByRole("button", { name: "Save mood" }));

    await waitFor(() => expect(screen.getByLabelText("Current path")).toHaveTextContent("/history"));
    expect(flow.logMood).toHaveBeenCalledTimes(1);
    expect(flow.logMood).toHaveBeenCalledWith({ date: "2026-11-10", moods: ["Centered"], comment: "Remember this." });
    expect(flow.upload).toHaveBeenNthCalledWith(1, 42, flow.photos[0]);
    expect(flow.upload).toHaveBeenNthCalledWith(2, 42, flow.photos[1]);
  });

  it("keeps the form and photos available when mood creation fails and starts no uploads", async () => {
    flow.logMood.mockRejectedValueOnce(new Error("API unavailable"));
    renderWithProviders(<><MoodEntryForm /><CurrentPath /></>);

    fireEvent.click(screen.getByRole("button", { name: "Save mood" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Your mood could not be saved");
    expect(screen.getByLabelText("Current path")).toHaveTextContent("/");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(flow.upload).not.toHaveBeenCalled();
  });

  it("retries only failed photos without creating a duplicate mood", async () => {
    flow.upload.mockResolvedValueOnce({ id: "uploaded-first" }).mockRejectedValueOnce(new Error("temporary upload failure"));
    renderWithProviders(<><MoodEntryForm /><CurrentPath /></>);

    fireEvent.click(screen.getByRole("button", { name: "Save mood" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("1 photo needs another try");
    expect(screen.getByRole("button", { name: "Retry failed photos" })).toBeInTheDocument();
    expect(flow.logMood).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Retry failed photos" }));
    await waitFor(() => expect(screen.getByLabelText("Current path")).toHaveTextContent("/history"));

    expect(flow.logMood).toHaveBeenCalledTimes(1);
    expect(flow.upload).toHaveBeenCalledTimes(3);
    expect(flow.upload).toHaveBeenNthCalledWith(3, 42, flow.photos[1]);
  });

  it("blocks rapid duplicate submissions while mood creation is pending", async () => {
    let finishCreate!: (value: { id: number; message: string }) => void;
    flow.logMood.mockImplementationOnce(() => new Promise((resolve) => { finishCreate = resolve; }));
    renderWithProviders(<><MoodEntryForm /><CurrentPath /></>);
    const saveButton = screen.getByRole("button", { name: "Save mood" });

    fireEvent.click(saveButton);
    fireEvent.click(saveButton);
    expect(flow.logMood).toHaveBeenCalledTimes(1);

    finishCreate({ id: 42, message: "Mood entry recorded." });
    await waitFor(() => expect(screen.getByLabelText("Current path")).toHaveTextContent("/history"));
  });
});
