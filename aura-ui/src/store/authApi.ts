// src/store/authApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  UserProfile,
  UpdateUserRequest,
  LoginRequest,
  LoginResponse,
} from "@/features/auth/models";
import { setToken } from "./slices/authSlice";
import type { AuraColor } from "@/features/mood/models/aura";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL + "/Auth",
    prepareHeaders: (headers, { getState }) => {
      // if you store your JWT in redux or localStorage, inject it here:
      const token = (getState() as any).auth.token;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["User"],
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, LoginRequest>({
      query: (creds) => ({ url: "/login", method: "POST", body: creds }),
      // stash the token in your slice as soon as login succeeds
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(setToken(data.token));
      },
    }),
    // Fetch current user
    getCurrentUser: build.query<UserProfile, void>({
      query: () => "/me",
      providesTags: ["User"],
    }),

    // Update profile
    updateUser: build.mutation<UserProfile, UpdateUserRequest>({
      query: (body) => ({
        url: "/update",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["User"], // auto-refetch getCurrentUser
    }),
    updateAura: build.mutation<
      UserProfile,
      { auraColor: AuraColor; auraIntensity: number }
    >({
      query: ({ auraColor, auraIntensity }) => ({
        url: "/updateAura",
        method: "PATCH",
        body: { auraColor, auraIntensity },
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useGetCurrentUserQuery,
  useUpdateUserMutation,
  useLoginMutation,
  useUpdateAuraMutation
} = authApi;
