// src/store/authSlice.ts
import type { UserProfile } from "@/features/auth/models";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { authApi } from "../authApi";
import type { RootState } from "../store";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  profile: UserProfile | null;
}

const token = localStorage.getItem("token");

const initialState: AuthState = {
  token: token || null, // ✅ Make sure it's null if missing
  isAuthenticated: !!token, // ✅ Only true if token exists
  profile: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem("token", action.payload);
    },

    logout(state) {
      state.token = null;
      state.isAuthenticated = false;
      state.profile = null;

      localStorage.removeItem("token");
      localStorage.removeItem("session_hydrated");
    },
    setProfile(state, action: PayloadAction<UserProfile | null>) {
      state.profile = action.payload;
      if (action.payload) {
        state.isAuthenticated = true;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        authApi.endpoints.getCurrentUser.matchFulfilled,
        (state, { payload }) => {
          state.profile = payload;
          state.isAuthenticated = true;
        }
      )
      .addMatcher(authApi.endpoints.getCurrentUser.matchRejected, (state) => {
        // Token is invalid or expired - clear auth state
        state.token = null;
        state.isAuthenticated = false;
        state.profile = null;
        localStorage.removeItem("token");
      })
      .addMatcher(
        authApi.endpoints.updateUser.matchFulfilled,
        (state, { payload }) => {
          state.profile = payload;
        }
      )
      .addMatcher(
        authApi.endpoints.updateAura.matchFulfilled,
        (state, { payload }) => {
          state.profile = payload;
        }
      );
  },
});

export const {
  setToken,
  logout,
  setProfile,
} = authSlice.actions;

export const selectCurrentUser = (state: RootState) => state.auth.profile;
export const selectSelectedPathway = (state: RootState) =>
  state.auth.profile?.selectedPathway ?? null;

export default authSlice.reducer;
