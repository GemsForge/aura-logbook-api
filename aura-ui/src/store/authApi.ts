// src/store/authApi.ts
import type {
  LoginRequest,
  LoginResponse,
  UpdateUserRequest,
  UserProfile,
} from "@/features/auth/models";
import type { AuraColor } from "@/features/mood/models/aura";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logout, setToken } from "./slices/authSlice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL + "/Auth",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as any).auth.token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

const baseQueryWithLogout: typeof rawBaseQuery = async (
  args,
  api,
  extraOptions
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (
    result.error &&
    (result.error.status === 401 || result.error.status === 403)
  ) {
    api.dispatch(logout());
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }
  return result;
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithLogout,
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
