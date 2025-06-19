// src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import moodReducer from "./slices/moodSlice"; 

export const store = configureStore({
  reducer: {
    auth: authReducer,
    moods: moodReducer,
  },
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
