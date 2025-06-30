// src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import uiReducer from "./slices/uiSlice";
import { weatherApi } from "./weatherApi";
import { auraApi } from "./auraApi";
import { authApi } from "./authApi";
import { moodApi } from "./moodApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // moods: moodReducer,
    ui: uiReducer,
    [weatherApi.reducerPath]: weatherApi.reducer,
    [auraApi.reducerPath]: auraApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [moodApi.reducerPath]: moodApi.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(weatherApi.middleware, auraApi.middleware, authApi.middleware, moodApi.middleware),
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
