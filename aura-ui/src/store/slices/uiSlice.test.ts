import { describe, expect, it } from "vitest";
import uiReducer, {
  closeProfileModal,
  openProfileModal,
  selectIsProfileModalOpen,
} from "./uiSlice";
import type { RootState } from "../store";

describe("uiSlice", () => {
  it("should return the initial state", () => {
    const state = uiReducer(undefined, { type: "unknown" });

    expect(state).toEqual({
      isProfileModalOpen: false,
    });
  });

  it("should open the profile modal", () => {
    const state = uiReducer(undefined, openProfileModal());

    expect(state.isProfileModalOpen).toBe(true);
  });

  it("should close the profile modal", () => {
    const previousState = {
      isProfileModalOpen: true,
    };

    const state = uiReducer(previousState, closeProfileModal());

    expect(state.isProfileModalOpen).toBe(false);
  });

  it("should select whether the profile modal is open", () => {
    const mockRootState = {
      ui: {
        isProfileModalOpen: true,
      },
    } as RootState;

    const result = selectIsProfileModalOpen(mockRootState);

    expect(result).toBe(true);
  });
});
