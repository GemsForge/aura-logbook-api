import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "./store";

export interface SpotifyConnection { configured: boolean; connected: boolean }
export interface SpotifyPlaylist { id: string; name: string; imageUrl: string | null; spotifyUrl: string | null }
export interface SpotifyPlaylists { items: SpotifyPlaylist[]; hasMore: boolean; nextOffset: number | null }
export interface SpotifyPlayback { name: string; artists: string; imageUrl: string | null; spotifyUrl: string | null; isPlaying: boolean }

/** User IDs partition cached metadata; authorization always comes from the bearer token. */
export const spotifyApi = createApi({
  reducerPath: "spotifyApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_BASE_URL}/spotify`,
    timeout: 15000,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["SpotifyConnection"],
  endpoints: (build) => ({
    connectSpotify: build.mutation<{ authorizationUrl: string }, void>({
      query: () => ({ url: "/connect", method: "POST" }),
    }),
    getSpotifyConnection: build.query<SpotifyConnection, number>({
      query: () => "/connection", providesTags: ["SpotifyConnection"],
    }),
    disconnectSpotify: build.mutation<void, void>({
      query: () => ({ url: "/connection", method: "DELETE" }),
    }),
    getCurrentlyPlaying: build.query<SpotifyPlayback | null, number>({
      query: () => "/currently-playing", providesTags: ["SpotifyConnection"],
    }),
    getSpotifyPlaylists: build.query<SpotifyPlaylists, { userId: number; offset?: number }>({
      query: ({ offset = 0 }) => `/playlists?offset=${offset}`, providesTags: ["SpotifyConnection"],
    }),
  }),
});

export const {
  useConnectSpotifyMutation, useGetSpotifyConnectionQuery, useDisconnectSpotifyMutation,
  useGetCurrentlyPlayingQuery, useGetSpotifyPlaylistsQuery, useLazyGetSpotifyPlaylistsQuery,
} = spotifyApi;
