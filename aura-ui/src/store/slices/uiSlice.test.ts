import { describe, expect, it } from "vitest";
import uiReducer, {
  closeProfileModal,
  openProfileModal,
  selectIsProfileModalOpen,
  selectInterfaceThemePreview,
  setInterfaceThemePreview,
} from "./uiSlice";
import type { RootState } from "../store";

describe("uiSlice", () => {
  it("should return the initial state", () => {
    const state = uiReducer(undefined, { type: "unknown" });

    expect(state).toEqual({
      isProfileModalOpen: false,
      interfaceThemePreview: null,
      interfaceModePreview: null, pendingInterfaceMode: null, guestInterfaceMode: "light",
    });
  });

  it("should open the profile modal", () => {
    const state = uiReducer(undefined, openProfileModal());

    expect(state.isProfileModalOpen).toBe(true);
    expect(state.interfaceThemePreview).toBeNull();
  });

  it("should close the profile modal", () => {
    const previousState = {
      ...uiReducer(undefined, { type: "init" }),
      isProfileModalOpen: true,
      interfaceThemePreview: "Ocean" as const,
    };

    const state = uiReducer(previousState, closeProfileModal());

    expect(state.isProfileModalOpen).toBe(false);
    expect(state.interfaceThemePreview).toBeNull();
  });

  it("stores and selects a temporary interface theme preview", () => {
    const state = uiReducer(undefined, setInterfaceThemePreview("Ocean"));
    const mockRootState = { ui: state } as RootState;

    expect(selectInterfaceThemePreview(mockRootState)).toBe("Ocean");
  });

  it("should select whether the profile modal is open", () => {
    const mockRootState = {
      ui: {
        isProfileModalOpen: true,
        interfaceThemePreview: null,
      interfaceModePreview: null, pendingInterfaceMode: null, guestInterfaceMode: "dark",
      },
    } as RootState;

    const result = selectIsProfileModalOpen(mockRootState);

    expect(result).toBe(true);
  });
});
