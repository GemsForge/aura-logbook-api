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

`Jwt:Key` signs and validates sign-in tokens. It is a secret and is not in
`appsettings.json`; the API refuses to start when it is missing or shorter than
32 bytes. Set it locally with user secrets:

```bash
dotnet user-secrets --project AuraLogbook.Api set "Jwt:Key" "$(openssl rand -base64 48)"
```

Each deployed environment needs its own random `Jwt__Key` from the hosting
platform's secret store. Changing the key signs everyone out once; they sign in
again normally. A key that was ever committed must be treated as exposed and
replaced.

## Email (SMTP) configuration

Account recovery sends mail through any SMTP relay (provider decision for #335:
standard SMTP, so the relay can be Postmark, Amazon SES, SendGrid or another
provider without code changes). `Email:Smtp:Host`, `Port`, `UseImplicitTls`,
`FromAddress` and `FromName` are configuration. `Email:Smtp:Username` and
`Email:Smtp:Password` are secrets.

```bash
dotnet user-secrets set "Email:Smtp:Username" "your-smtp-username"
dotnet user-secrets set "Email:Smtp:Password" "your-smtp-password"
```

In deployments, use `Email__Smtp__Username` and `Email__Smtp__Password` from the
hosting platform's secret store. Development ignores SMTP settings and logs
mail instead. See [Runtime environments](runtime-environments.md#password-recovery)
for how recovery is enabled per environment.

## Sacred-text providers (#392)

The Faith & Religion pathway shows a neutral Word of the Day with no provider or key. A sacred-text
passage is returned only for the one framework the client requests (`GET /api/faith/passage?framework=christian|muslim|jewish`);
any other value returns `204 No Content`.

| Framework | Default source | Translation and license | Key needed |
|---|---|---|---|
| `christian` | bible-api.com | World English Bible, public domain | No |
| `muslim` | Quran.com API (Quran Foundation) | Saheeh International | No |
| `jewish` | Sefaria | JPS 1917 (*The Holy Scriptures: A New Translation*), public domain | No |

Christian and Jewish passages default to public-domain translations, so no non-commercial or
display license applies. To use a different licensed Bible translation instead, set both:

```bash
SacredText__ApiBibleKey=your-api-bible-key
SacredText__ApiBibleBibleId=id-of-a-translation-licensed-for-display
```

The Sefaria version is pinned with `SacredText__SefariaVersion`. Daily references are Tanakh
verses because JPS 1917 covers the Tanakh. Keys stay server-side. Each day's passage is cached
(`SacredText__CacheDuration`, default 6 hours) to respect provider rate limits. The attribution
returned by the API must be shown with the text. Review the Saheeh International translation's
terms before production use.

## What not to commit

Do not commit:

- `.env` files containing credentials
- `appsettings.*.json` files containing real secrets
- Spotify Client Secrets
- JWT signing keys
- Access or refresh tokens

If a secret is accidentally committed, revoke or rotate it immediately and remove it from the repository history through the project's approved remediation process.
