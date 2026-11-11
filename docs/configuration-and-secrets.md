# Configuration and Secrets

Aura Logbook uses configuration values and secrets differently. Keeping that distinction clear prevents credentials from being committed or exposed to the frontend.

## The difference

### Configuration values

Configuration values control how the application runs but are not inherently sensitive. They may be stored in `appsettings.json`, environment-specific settings, or environment variables.

Examples:

- API base URLs
- Local ports
- OAuth redirect URIs
- Feature flags

### Secrets

Secrets authenticate the application or grant access to protected services. They must not be committed to Git, placed in frontend code, or included in public configuration files.

Examples:

- Spotify Client Secret
- JWT signing key
- Third-party API keys
- Database passwords

## Spotify configuration

The Spotify Client ID and redirect URI are configuration values. The Spotify Client Secret is a secret and must remain server-side.

For local development, configure the API with ASP.NET user secrets from the `AuraLogbook.Api` directory:

```bash
dotnet user-secrets set "Spotify:ClientId" "your-client-id"
dotnet user-secrets set "Spotify:ClientSecret" "your-client-secret"
dotnet user-secrets set "Spotify:RedirectUri" "http://127.0.0.1:5082/api/spotify/callback"
```

User secrets are stored outside the repository and are not included in commits.

For deployment, use the hosting platform's secret and environment configuration:

```text
Spotify__ClientId=your-client-id
Spotify__ClientSecret=your-client-secret
Spotify__RedirectUri=https://your-domain.example/api/spotify/callback
```

The redirect URI configured in Spotify's Developer Dashboard must exactly match the URI used by the running API.

The Spotify authorization request asks for these read permissions:

- `user-read-currently-playing` for playback metadata
- `playlist-read-private` and `playlist-read-collaborative` for playlists

When requested permissions change, reconnect Spotify in Aura Logbook to review and grant the updated access. The integration uses the currently-playing endpoint matching `user-read-currently-playing`. See [Spotify integration](spotify-integration.md) for setup, storage, routes and recovery.

## JWT signing key

`Jwt:Key` is a secret and is not in `appsettings.json`. The API refuses to start
when it is missing or shorter than 32 bytes, and the error names the setting,
never the value.

```bash
dotnet user-secrets --project AuraLogbook.Api/AuraLogbook.Api.csproj set "Jwt:Key" "$(openssl rand -base64 48)"
```

Deployments set `Jwt__Key` in the hosting platform's secret store. Changing the
key signs everyone out; they sign in again.

### Rotating previously committed credentials

Earlier commits contained a JWT signing key and an unused Aztro RapidAPI key in
`appsettings.json`. They remain in Git history, so treat both as exposed:

1. Set a new random `Jwt__Key` in every deployed environment, then restart.
2. Revoke the old key in the RapidAPI dashboard. The API no longer reads it.
3. Do not rewrite Git history to remove them; rotation is what makes the old
   values useless.

## What not to commit

Do not commit:

- `.env` files containing credentials
- `appsettings.*.json` files containing real secrets
- Spotify Client Secrets
- JWT signing keys
- Access or refresh tokens

If a secret is accidentally committed, revoke or rotate it immediately and remove it from the repository history through the project's approved remediation process.
