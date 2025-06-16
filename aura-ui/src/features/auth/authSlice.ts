// src/store/authSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  userEmail: string | null;
}

const initialState: AuthState = {
  token: null,
  isAuthenticated: false,
  userEmail: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<{ token: string; email: string }>) {
      state.token = action.payload.token;
      state.userEmail = action.payload.email;
      state.isAuthenticated = true;
    },
    logout(state) {
      state.token = null;
      state.userEmail = null;
      state.isAuthenticated = false;
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;

export default authSlice.reducer;
