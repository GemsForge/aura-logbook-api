// src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import moodReducer from "./slices/moodSlice"; 
import uiReducer from "./slices/uiSlice";
import { weatherApi } from "./weatherApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    moods: moodReducer,
    ui: uiReducer,
    [weatherApi.reducerPath]: weatherApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(weatherApi.middleware),
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
