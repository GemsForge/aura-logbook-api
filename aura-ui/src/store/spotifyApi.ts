import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "./store";

const baseQuery = fetchBaseQuery({
  baseUrl: `${import.meta.env.VITE_API_BASE_URL}/Spotify`,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

/** Provides authenticated Spotify connection and metadata queries for the UI. */
export const spotifyApi = createApi({
  reducerPath: "spotifyApi",
  baseQuery,
  tagTypes: ["SpotifyConnection"],
  endpoints: (build) => ({
    getSpotifyConnectUrl: build.query<{ authorizationUrl: string }, void>({ query: () => "/connect" }),
    getSpotifyConnection: build.query<{ connected: boolean }, void>({ query: () => "/connection", providesTags: ["SpotifyConnection"] }),
    disconnectSpotify: build.mutation<void, void>({ query: () => ({ url: "/connection", method: "DELETE" }), invalidatesTags: ["SpotifyConnection"] }),
    getCurrentlyPlaying: build.query<Record<string, unknown> | null, void>({ query: () => "/currently-playing" }),
    getSpotifyPlaylists: build.query<{ items?: Array<Record<string, unknown>> }, void>({ query: () => "/playlists" }),
  }),
});

export const {
  useLazyGetSpotifyConnectUrlQuery,
  useGetSpotifyConnectionQuery,
  useDisconnectSpotifyMutation,
  useGetCurrentlyPlayingQuery,
  useGetSpotifyPlaylistsQuery,
} = spotifyApi;
