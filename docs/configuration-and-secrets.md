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
dotnet user-secrets set "Spotify:RedirectUri" "http://localhost:5082/api/spotify/callback"
```

User secrets are stored outside the repository and are not included in commits.

For deployment, use the hosting platform's secret and environment configuration:

```text
Spotify__ClientId=your-client-id
Spotify__ClientSecret=your-client-secret
Spotify__RedirectUri=https://your-domain.example/api/spotify/callback
```

The redirect URI configured in Spotify's Developer Dashboard must exactly match the URI used by the running API.

## What not to commit

Do not commit:

- `.env` files containing credentials
- `appsettings.*.json` files containing real secrets
- Spotify Client Secrets
- JWT signing keys
- Access or refresh tokens

If a secret is accidentally committed, revoke or rotate it immediately and remove it from the repository history through the project's approved remediation process.
