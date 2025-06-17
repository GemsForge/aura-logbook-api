// src/store/authSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  userEmail: string | null;
}

const token = localStorage.getItem("token");
const email = localStorage.getItem("userEmail");

const initialState: AuthState = {
  token,
  isAuthenticated: !!token,
  userEmail: email,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess(
      state,
      action: PayloadAction<{ token: string; email: string }>
    ) {
      state.token = action.payload.token;
      state.userEmail = action.payload.email;
      state.isAuthenticated = true;
      localStorage.setItem("token", token!);
      localStorage.setItem("userEmail", email!);
    },
    logout(state) {
      state.token = null;
      state.userEmail = null;
      state.isAuthenticated = false;
      localStorage.removeItem("token");
      localStorage.removeItem("userEmail");
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;

export default authSlice.reducer;
