// src/store/authSlice.ts
import type { UserProfile } from "@/features/auth/models";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: UserProfile | null; // ← store the whole profile here
}

const token = localStorage.getItem("token");
// const email = localStorage.getItem("email");

const savedProfile = localStorage.getItem("userProfile");

const initialState: AuthState = {
  token,
  isAuthenticated: !!token,
  user: savedProfile ? JSON.parse(savedProfile) : null,
};;

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
  },
});

export const { loginSuccess, logout, setUserProfile } = authSlice.actions;

export const selectCurrentUser = (state: RootState) => state.auth.user;

export default authSlice.reducer;
