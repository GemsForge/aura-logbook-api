// src/store/authSlice.ts
import type { UserProfile } from "@/features/auth/models";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import type { AuraColor } from "@/features/mood/models/aura";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: UserProfile | null; // ← store the whole profile here
}

const token = localStorage.getItem("token");
// const email = localStorage.getItem("email");

const savedProfileRaw = localStorage.getItem("userProfile");
function loadSavedProfile(): UserProfile|null{
  if(!savedProfileRaw || savedProfileRaw === "undefined") return null;
  try{
    return JSON.parse(savedProfileRaw) as UserProfile;
    } catch {
      console.warn("Failed to parse saved userProfile: ", savedProfileRaw);
      return null;
  }
}

const initialState: AuthState = {
  token,
  isAuthenticated: !!token,
  user: loadSavedProfile()
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess(
      state,
      action: PayloadAction<{ token: string; profile: UserProfile }>
    ) {
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.user = action.payload.profile;
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem(
        "userProfile",
        JSON.stringify(action.payload.profile)
      );
    },

    logout(state) {
      state.token = null;
      state.isAuthenticated = false;
      state.user = null;

      localStorage.removeItem("token");
      localStorage.removeItem("userProfile");
      localStorage.removeItem("session_hydrated");
    },

    setUserProfile(state, action: PayloadAction<UserProfile>) {
      if (!state.user) return;
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem("userProfile", JSON.stringify(state.user));
    },
    // Aura-specific setters
    setAuraColor(state, action: PayloadAction<AuraColor>) {
      if (!state.user) return;
      state.user.auraColor = action.payload;
      localStorage.setItem("userProfile", JSON.stringify(state.user));
    },
    setAuraIntensity(state, action: PayloadAction<number>) {
      if (!state.user) return;
      state.user.auraIntensity = action.payload;
      localStorage.setItem("userProfile", JSON.stringify(state.user));
    },
  },
});


export const {
  loginSuccess,
  logout,
  setUserProfile,
  setAuraColor,
  setAuraIntensity,
} = authSlice.actions;

export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectAuraColor = (state: RootState) =>
  (state.auth.user?.auraColor as AuraColor) ?? "blue";
export const selectAuraIntensity = (state: RootState) =>
  state.auth.user?.auraIntensity ?? 500;

export default authSlice.reducer;
