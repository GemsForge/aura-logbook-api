// src/store/slices/uiSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import type { InterfaceTheme } from "@/features/auth/models/InterfaceTheme";

interface UIState {
  isProfileModalOpen: boolean;
  interfaceThemePreview: InterfaceTheme | null;
}

const initialState: UIState = {
  isProfileModalOpen: false,
  interfaceThemePreview: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openProfileModal(state) {
      state.isProfileModalOpen = true;
      state.interfaceThemePreview = null;
    },
    closeProfileModal(state) {
      state.isProfileModalOpen = false;
      state.interfaceThemePreview = null;
    },
    setInterfaceThemePreview(state, action: PayloadAction<InterfaceTheme | null>) {
      state.interfaceThemePreview = action.payload;
    },
  },
});

export const { openProfileModal, closeProfileModal, setInterfaceThemePreview } = uiSlice.actions;
export const selectIsProfileModalOpen = (state: RootState) =>
  state.ui.isProfileModalOpen;
/** Returns the temporary unsaved interface choice used for live profile previews. */
export const selectInterfaceThemePreview = (state: RootState) =>
  state.ui.interfaceThemePreview;

export default uiSlice.reducer;
