// src/store/authApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  UserProfile,
  UpdateUserRequest,
  LoginRequest,
  LoginResponse,
} from "@/features/auth/models";

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

    // (optional) login/register if you want here too:
    login: build.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: "/login",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetCurrentUserQuery,
  useUpdateUserMutation,
  useLoginMutation,
} = authApi;
