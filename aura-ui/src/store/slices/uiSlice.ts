// src/store/slices/uiSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../store";

interface UIState {
  isProfileModalOpen: boolean;
}

const initialState: UIState = {
  isProfileModalOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openProfileModal(state) {
      state.isProfileModalOpen = true;
    },
    closeProfileModal(state) {
      state.isProfileModalOpen = false;
    },
  },
});

export const { openProfileModal, closeProfileModal } = uiSlice.actions;
export const selectIsProfileModalOpen = (state: RootState) =>
  state.ui.isProfileModalOpen;

export default uiSlice.reducer;
