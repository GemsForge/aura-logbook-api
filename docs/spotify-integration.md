# Spotify integration

Aura links a Spotify account to the signed-in Aura user. The dashboard card below Weather shows current listening metadata and up to six playlist cards with links to Spotify. Audio plays in Spotify.

## Local setup

Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and select Web API. Register this exact redirect URI:

```text
http://127.0.0.1:5082/api/spotify/callback
```

From the repository root, save credentials in the API's development secret store:

```bash
dotnet user-secrets set "Spotify:ClientId" "<client-id>" --project AuraLogbook.Api
dotnet user-secrets set "Spotify:ClientSecret" "<client-secret>" --project AuraLogbook.Api
dotnet user-secrets set "Spotify:RedirectUri" "http://127.0.0.1:5082/api/spotify/callback" --project AuraLogbook.Api
```

Run `npm run dev`, sign in to Aura, then select Connect Spotify. Startup applies the additive OAuth-attempt migration. Existing mood records and Spotify connections are preserved. After upgrading an already-running API, restart it to load the new implementation; start a fresh Connect attempt rather than reusing an earlier approval URL.

Run only one API instance on the callback port. The development launcher now stops if its requested API port is already occupied. Automatically moving the UI to a new API port while Spotify returns to the registered old port sends the OAuth attempt to a different process and breaks sign-in.

`Spotify:FrontendRedirectUri` defaults to `http://127.0.0.1:58407/dashboard`. Change it when using a different UI address. The Spotify callback must match the registered URI and actual API port. A browser enforcing HTTPS-only must allow the local loopback HTTP callback; production uses HTTPS. See [Spotify's redirect requirements](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri).

## Authorization and storage

- OAuth uses Authorization Code with PKCE. Each random state is stored only as a hash; its verifier is encrypted with ASP.NET Data Protection.
- SQLite stores pending attempts for ten minutes. Atomic consumption prevents reuse. Starting a new attempt replaces the same user's pending attempt.
- The token exchange uses the redirect URI saved at the start of the attempt.
- Account linking reads Spotify's `account_id` field, with `id` supported for older responses.
- Access and refresh tokens are encrypted in the existing connection table. Persist the Data Protection key ring across server restarts and deployments; losing it requires reconnecting Spotify.
- Expired access tokens refresh on the server. Requests from the same user serialize refreshes, preserving rotated refresh tokens. A Spotify 401 triggers one refresh/retry.
- Disconnect removes Aura's local connection; it does not revoke Spotify's app grant. Users can revoke that grant in their Spotify account settings.

Only `user-read-currently-playing`, `playlist-read-private` and `playlist-read-collaborative` are requested. Listening uses `GET /me/player/currently-playing`, matching the requested permission. A stopped or unavailable playback session returns a normal empty state. [Spotify authorization guide](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow).

## API and UI recovery

All routes except the OAuth callback require an Aura bearer token:

| Route | Result |
| --- | --- |
| `POST /api/spotify/connect` | Fresh authorization URL |
| `GET /api/spotify/callback` | Consumes state, exchanges code, redirects to configured UI |
| `GET /api/spotify/connection` | `{ configured, connected }` |
| `DELETE /api/spotify/connection` | Removes stored connection |
| `GET /api/spotify/currently-playing` | Normalized track metadata or `null` |
| `GET /api/spotify/playlists` | `{ items, hasMore }`, up to 50 normalized playlists |

Metadata includes names, artwork URLs and Spotify links, never credentials. Error responses contain a safe `code` and `message`. The card shows independent loading, empty and failure states, retains available data during failed refreshes, and offers Retry or Reconnect. Cache entries are partitioned by Aura user and cleared on disconnect.

The API distinguishes expired state, missing configuration, expired authorization, access denial, rate limiting and provider unavailability. Logs record failure categories without authorization codes or tokens. The connection card consumes the callback status once and removes it from the dashboard URL.

For denied access, check Spotify's app user-access settings and current development-mode account requirements. Retry after a rate-limit warning; do not repeatedly reconnect. Configuration/secrets are described in [Configuration and Secrets](configuration-and-secrets.md).

## Verification

```bash
dotnet test AuraLogbook.Api.Tests --filter FullyQualifiedName~Spotify
cd aura-ui
npx vitest run src/components/profile/SpotifyConnectionCard.test.tsx src/pages/tests/Dashboard.test.tsx
npm run build
```

Tests mock Spotify and use temporary databases, never real account credentials. Live acceptance requires approving Connect Spotify in a browser, checking playlist artwork/links, starting music in Spotify, refreshing listening metadata, and disconnecting.
