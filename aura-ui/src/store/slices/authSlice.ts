// src/store/authSlice.ts
import type { UserProfile } from "@/features/auth/models";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  userEmail: string | null;
  displayName?: string;
  zodiacSign?: string;
  birthday?: string;
}

const token = localStorage.getItem("token");
const email = localStorage.getItem("userEmail");


const initialState: AuthState = {
  token,
  isAuthenticated: !!token,
  userEmail: email,
  displayName: '',
  zodiacSign: '',
  birthday: '',
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess(
      state,
      action: PayloadAction<{ token: string; email: string }>
    ) {
      const { token, email } = action.payload;
      state.token = token;
      state.userEmail = email;
      state.isAuthenticated = true;
      localStorage.setItem("token", token);
      localStorage.setItem("userEmail", email);
    },
    logout(state) {
      state.token = null;
      state.userEmail = null;
      state.isAuthenticated = false;
      localStorage.removeItem("token");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("session_hydrated");
    },
    setUserProfile(state, action: PayloadAction<UserProfile>) {
      state.displayName = action.payload.displayName;
      state.birthday = action.payload.birthday;
      state.zodiacSign = action.payload.zodiacSign;
      state.userEmail = action.payload.email;
    },
  },
});

export const { loginSuccess, logout, setUserProfile } = authSlice.actions;

export default authSlice.reducer;
