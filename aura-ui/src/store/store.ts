// src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import uiReducer from "./slices/uiSlice";
import { weatherApi } from "./weatherApi";
import { auraApi } from "./auraApi";
import { authApi } from "./authApi";
import { moodApi } from "./moodApi";
import { referenceDataApi } from "./referenceDataApi";
import { spotifyApi } from "./spotifyApi";
import { attachStore } from "@/api/api";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // moods: moodReducer,
    ui: uiReducer,
    [weatherApi.reducerPath]: weatherApi.reducer,
    [auraApi.reducerPath]: auraApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [moodApi.reducerPath]: moodApi.reducer,
    [referenceDataApi.reducerPath]: referenceDataApi.reducer,
    [spotifyApi.reducerPath]: spotifyApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      weatherApi.middleware,
      auraApi.middleware,
      authApi.middleware,
      moodApi.middleware,
      referenceDataApi.middleware,
      spotifyApi.middleware
    ),
});

// The axios client reads the token and dispatches logout through this attachment (no import cycle).
attachStore(store);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
