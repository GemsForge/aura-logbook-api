import { act, fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/testUtilities";
import { setProfile } from "@/store/slices/authSlice";
import { GUEST_MODE_STORAGE_KEY, readGuestInterfaceMode, selectInterfaceMode } from "@/store/slices/uiSlice";
import type { RootState } from "@/store/store";
import { ThemeModeToggle } from "./ThemeModeToggle";

const mocks = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock("@/store/authApi", async (original) => ({ ...await original<object>(), useUpdateUserMutation: () => [mocks.update, { isLoading: false }] }));
const profile = { id: 9, email: "alex@example.test", displayName: "Alex", birthday: null, zodiacSign: "", selectedPathway: "Mindfulness", auraColor: "blue", auraIntensity: 72, interfaceTheme: "Ocean", interfaceMode: "dark" } as const;

/** Choose a persisted preference through the same accessible menu as the header. */
function choose(label: string) {
  fireEvent.click(screen.getByRole("button", { name: "Screen mode" }));
  fireEvent.click(screen.getByRole("menuitemradio", { name: label }));
}
describe("ThemeModeToggle", () => {
  beforeEach(() => { localStorage.clear(); mocks.update.mockReset(); });
  it("stores a guest mode independently and restores it from browser storage", () => {
    const { store } = renderWithProviders(<ThemeModeToggle />);
    choose("Dark");
    expect(selectInterfaceMode(store.getState() as RootState)).toBe("dark");
    expect(localStorage.getItem(GUEST_MODE_STORAGE_KEY)).toBe("dark");
    expect(readGuestInterfaceMode()).toBe("dark");
    expect(screen.getByRole("button", { name: "Screen mode" })).toBeEnabled();
  });
  it("keeps a guest session usable when browser storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    renderWithProviders(<ThemeModeToggle />);
    choose("Dark");
    expect(screen.getByRole("button", { name: "Screen mode" })).toBeEnabled();
    expect(screen.getByRole("alert")).toHaveTextContent("It applies for this visit");
    vi.restoreAllMocks();
  });
  it("previews immediately, sends only mode and required profile fields, then rolls back on failure", async () => {
    let reject!: (reason: Error) => void;
    mocks.update.mockReturnValue({ unwrap: () => new Promise((_resolve, fail) => { reject = fail; }) });
    const { store } = renderWithProviders(<ThemeModeToggle />, { preloadedState: { auth: { token: "token", isAuthenticated: true, profile } } });
    choose("Light");
    expect(selectInterfaceMode(store.getState() as RootState)).toBe("light");
    expect(mocks.update).toHaveBeenCalledWith({ id: 9, email: profile.email, displayName: "Alex", interfaceMode: "light" });
    expect(store.getState().auth.profile).toEqual(profile);
    await act(async () => { reject(new Error("offline")); });
    expect(selectInterfaceMode(store.getState() as RootState)).toBe("dark");
    expect(screen.getByRole("alert")).toHaveTextContent("previous mode has been restored");
    expect(store.getState().auth.profile).toEqual(profile);
  });
  it.each(["Light", "Dark", "Use device setting"])("saves %s without coupling the request to a pathway", async (label) => {
    mocks.update.mockReturnValue({ unwrap: () => Promise.resolve() });
    const profileWithoutPathway = { ...profile, interfaceMode: label === "Dark" ? "light" : "dark", selectedPathway: undefined };
    renderWithProviders(<ThemeModeToggle />, { preloadedState: { auth: { token: "token", isAuthenticated: true, profile: profileWithoutPathway } } });

    choose(label);

    const expectedMode = label === "Use device setting" ? "system" : label.toLowerCase();
    expect(mocks.update).toHaveBeenCalledWith({ id: 9, email: profile.email, displayName: "Alex", interfaceMode: expectedMode });
  });
  it("hands a successful preview over to the saved profile", async () => {
    let resolve!: () => void;
    mocks.update.mockReturnValue({ unwrap: () => new Promise<void>((done) => { resolve = done; }) });
    const { store } = renderWithProviders(<ThemeModeToggle />, { preloadedState: { auth: { token: "token", isAuthenticated: true, profile } } });
    choose("Light");
    await act(async () => { store.dispatch(setProfile({ ...profile, interfaceMode: "light" })); resolve(); });
    expect(selectInterfaceMode(store.getState() as RootState)).toBe("light");
    expect(store.getState().ui.pendingInterfaceMode).toBeNull();
    expect(store.getState().auth.profile).toEqual({ ...profile, interfaceMode: "light" });
  });
});
