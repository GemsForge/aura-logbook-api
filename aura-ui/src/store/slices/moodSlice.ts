// src/store/slices/moodSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { MoodApi } from "../../api/MoodApi";
import type { RootState } from "../store";
import type { MoodEntry, MoodEntryRequest } from "@/features/mood/models/schema";

// 🌀 Async Thunks
export const fetchMoods = createAsyncThunk<MoodEntry[]>(
  "moods/fetchAll",
  async () => {
    return await MoodApi.getAllMoods();
  }
);

export const createMood = createAsyncThunk<string, MoodEntryRequest>(
  "moods/create",
  async (payload) => {
    return await MoodApi.logMood(payload);
  }
);

export const updateMood = createAsyncThunk<
  string,
  { id: number; payload: MoodEntryRequest }
>("moods/update", async ({ id, payload }) => {
  return await MoodApi.updateMood(id, payload);
});

export const deleteMood = createAsyncThunk<string, number>(
  "moods/delete",
  async (id) => {
    return await MoodApi.deleteMood(id);
  }
);

// 🧠 State
interface MoodState {
  entries: MoodEntry[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  message: string | null;
}

const initialState: MoodState = {
  entries: [],
  status: "idle",
  error: null,
  message: null,
};

// 🎯 Slice
const moodSlice = createSlice({
  name: "moods",
  initialState,
  reducers: {
    clearMoodError(state) {
      state.error = null;
    },
    clearMoodMessage(state) {
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder

      // FETCH
      .addCase(fetchMoods.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMoods.fulfilled, (state, action) => {
        state.entries = action.payload;
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(fetchMoods.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch mood history.";
      })

      // CREATE
      .addCase(createMood.fulfilled, (state, action) => {
        state.message = action.payload;
        state.status = "succeeded";
      })
      .addCase(createMood.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to create mood.";
      })

      // UPDATE
      .addCase(updateMood.fulfilled, (state, action) => {
        state.message = action.payload;
        state.status = "succeeded";
      })
      .addCase(updateMood.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to update mood.";
      })

      // DELETE
      .addCase(deleteMood.fulfilled, (state, action) => {
        state.message = action.payload;
        state.status = "succeeded";
      })
      .addCase(deleteMood.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to delete mood.";
      });
  },
});

// 🎯 Actions & Selectors
export const { clearMoodError, clearMoodMessage } = moodSlice.actions;

export const selectMoods = (state: RootState) => state.moods.entries;
export const selectMoodStatus = (state: RootState) => state.moods.status;
export const selectMoodError = (state: RootState) => state.moods.error;
export const selectMoodMessage = (state: RootState) => state.moods.message;

export default moodSlice.reducer;
