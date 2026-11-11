import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { DEFAULT_INTERFACE_MODE, resolveInterfaceTheme, resolveInterfaceMode, type InterfaceMode, type InterfaceTheme } from "@/features/auth/models/InterfaceTheme";

export const GUEST_MODE_STORAGE_KEY = "aura-interface-mode";
/** Browser storage can be unavailable; the guest session still starts safely in light mode. */
export function readGuestInterfaceMode(): InterfaceMode {
  try { return resolveInterfaceMode(localStorage.getItem(GUEST_MODE_STORAGE_KEY)); }
  catch { return DEFAULT_INTERFACE_MODE; }
}
/** Saves only display brightness; failures leave the current session usable. */
export function persistGuestInterfaceMode(mode: InterfaceMode): boolean {
  try { localStorage.setItem(GUEST_MODE_STORAGE_KEY, mode); return true; }
  catch { return false; }
}
interface UIState {
  isProfileModalOpen: boolean;
  interfaceThemePreview: InterfaceTheme | null;
  interfaceModePreview: InterfaceMode | null;
  pendingInterfaceMode: InterfaceMode | null;
  guestInterfaceMode: InterfaceMode;
}
const initialState: UIState = {
  isProfileModalOpen: false, interfaceThemePreview: null, interfaceModePreview: null,
  pendingInterfaceMode: null, guestInterfaceMode: readGuestInterfaceMode(),
};
const uiSlice = createSlice({
  name: "ui", initialState,
  reducers: {
    /** Opening and closing a profile draft clears its own preview, not the saved or guest mode. */
    openProfileModal(state) { state.isProfileModalOpen = true; state.interfaceThemePreview = null; state.interfaceModePreview = null; },
    closeProfileModal(state) { state.isProfileModalOpen = false; state.interfaceThemePreview = null; state.interfaceModePreview = null; },
    setInterfaceThemePreview(state, action: PayloadAction<InterfaceTheme | null>) { state.interfaceThemePreview = action.payload; },
    /** Profile previews and in-flight header saves have separate lifetimes. */
    setInterfaceModePreview(state, action: PayloadAction<InterfaceMode | null>) { state.interfaceModePreview = action.payload; },
    setPendingInterfaceMode(state, action: PayloadAction<InterfaceMode | null>) { state.pendingInterfaceMode = action.payload; },
    setGuestInterfaceMode(state, action: PayloadAction<InterfaceMode>) { state.guestInterfaceMode = action.payload; },
  },
});
export const { openProfileModal, closeProfileModal, setInterfaceThemePreview, setInterfaceModePreview, setPendingInterfaceMode, setGuestInterfaceMode } = uiSlice.actions;
export const selectIsProfileModalOpen = (state: RootState) => state.ui.isProfileModalOpen;
/** Unsaved profile family, independent of brightness. */
export const selectInterfaceThemePreview = (state: RootState) => state.ui.interfaceThemePreview;
/** Shared family resolution keeps the providers and decorative artwork on the same preview. */
export const selectInterfaceTheme = (state: RootState): InterfaceTheme =>
  resolveInterfaceTheme(state.ui.interfaceThemePreview ?? state.auth.profile?.interfaceTheme);
/** Resolves the active brightness for both providers and the one-click toggle. */
export const selectInterfaceMode = (state: RootState): InterfaceMode => state.ui.interfaceModePreview ?? state.ui.pendingInterfaceMode ??
  (state.auth.profile ? resolveInterfaceMode(state.auth.profile.interfaceMode, state.auth.profile.interfaceTheme) : state.ui.guestInterfaceMode ?? DEFAULT_INTERFACE_MODE);
export default uiSlice.reducer;
