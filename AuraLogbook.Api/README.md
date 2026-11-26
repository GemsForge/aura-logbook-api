# Aura Logbook API

The ASP.NET Core API for Aura Logbook. It serves authentication, mood tracking and dashboard, zodiac insight, and current-weather endpoints to the separate React UI.

## Run locally

From the repository root, the recommended command starts both API and UI:

```bash
npm ci --prefix aura-ui
npm run dev
```

The API listens at `http://localhost:5082`; Swagger is at `http://localhost:5082/swagger`. The combined launcher and port overrides are documented in the [root README](../README.md).

To run only the API from this directory:

```bash
dotnet restore
dotnet run --launch-profile http
```

The `http` launch profile uses the Development environment and port 5082. Swagger is available while running in Development.

## Configuration and data

- Settings are loaded from `appsettings.json`, environment-specific settings, environment variables, and .NET user secrets. `AuraLogbook.Api.csproj` defines the user-secrets ID `AuraLogbook.Api`.
- Browser requests are allowed only from origins in `Cors:AllowedOrigins`. Development includes the local UI origins `http://localhost:58407` and `http://127.0.0.1:58407`. Production must set the deployed UI origin in Azure App Settings, for example `Cors__AllowedOrigins__0=https://your-ui.example`; without it, API startup fails with a configuration error. Add further origins with indexed settings such as `Cors__AllowedOrigins__1` when explicitly required. Origins include their scheme and port and must not include a path.
- Provide a private `Jwt:Key` in user secrets or the deployment environment; do not commit signing keys or provider credentials. `Jwt:Issuer` and `Jwt:Audience` must match the values used by token validation.
- Production receives deployment-specific URLs and paths through environment variables (ASP.NET Core maps `__` to `:`). Keep credentials in the host's secret store.
- Production settings:

  | Setting | Example | Secret? |
  | --- | --- | --- |
  | `Database__ConnectionString` | `Data Source=/persistent/aura/auralogbook.db` | No; use a durable volume |
  | `Storage__PrivateMediaPath` | `/persistent/aura/private-media` | No; keep outside `wwwroot` on durable storage |
  | `Cors__AllowedOrigins__0` | `https://app.example.com` | No |
  | `PasswordReset__ResetUrlBase` | `https://app.example.com/reset-password` | No; needed only when password recovery is enabled |
  | `Spotify__RedirectUri` | `https://api.example.com/api/spotify/callback` | No; must match Spotify's registered callback |
  | `Spotify__FrontendRedirectUri` | `https://app.example.com/dashboard` | No |
  | `Spotify__ClientId` | `<spotify-client-id>` | No; needed only for Spotify linking |
  | `Spotify__ClientSecret` | `<spotify-client-secret>` | Yes; needed only for Spotify linking |
  | `Jwt__Key` | `<random-signing-key>` | Yes |
  | `Email__Smtp__Host` / `Email__Smtp__Port` / `Email__Smtp__FromAddress` | `<smtp-host>` / `587` / `no-reply@example.com` | No; needed only for password recovery |
  | `Email__Smtp__Username` / `Email__Smtp__Password` | `<smtp-user>` / `<smtp-password>` | Yes; needed only for password recovery |
  | `FreeAstroApi__ApiKey` | `<provider-key>` | Yes; needed for daily horoscope and moon data |
  | `FreeAstrologyApi__ApiKey` | `<provider-key>` | Yes; needed for birth charts |

- Development, Staging, and Production use the SQLite user, mood, zodiac-insight, and reflection repositories. Local defaults are separate files: Development uses `Data/auralogbook-dev.db`, FIT/Staging uses `Data/auralogbook-fit.db`, and Production uses `Data/auralogbook-prod.db`. Production is the current working database until hosting is decided. `Database:ConnectionString` selects the database; hosted deployments should override it with a durable path. Startup applies every versioned SQL migration not already recorded in `__SchemaMigrations`.
- After migrations, startup imports the curated mood-combination reflections from `Data/aura_logbook_mood_combinations.json`, which ships with the build (copied from `aura-ui/data`). The import is idempotent, touches no users or mood entries, and logs the source combination count and expected and stored interpretation counts, with `Status: reconciled` when they match or an error listing the mismatches when they don't. A missing or invalid source logs an error, keeps the existing rows, and the API still starts. Turn it off with `Database:ImportReflectionsOnStartup=false`. `DatabaseSeeder --mode reflections` runs the same import without a restart; see [Mood-combination reflections](../docs/mood-combination-reflections.md).
- Development can import users from the configured `Storage:UserFilePath` when `Database:SeedUsersOnStartup` is enabled. The broader JSON files remain import/audit sources; they are not the active Development repository.
- Production defaults to its own local SQLite database file and refuses to use the DEV or FIT database file. A hosted deployment must override the default with a durable path before relying on it, because an ephemeral host filesystem may lose data when instances restart or are replaced.
- The dashboard weather endpoint uses Open-Meteo's forecast and geocoding APIs and requires no API key for the project's current development use. See [DEPENDENCIES.md](../DEPENDENCIES.md) for attribution, limits, and terms.

## API surface

For the optional, pathway-aware reflection shown for selected mood combinations, see [Mood-combination reflections](../docs/mood-combination-reflections.md).

Controllers use the `/api` prefix. Key routes include:

| Area | Routes | Authentication |
| --- | --- | --- |
| Auth | `POST /api/Auth/register`, `POST /api/Auth/login`, `GET /api/Auth/me`, `PUT /api/Auth/update`, `PUT /api/Auth/me/onboarding` | Register and login are public; the other listed routes require a bearer token. New passwords (register, update) must be 8–72 characters. Registration needs only email, password and display name; birthday and pathway are optional and aura color is no longer an input (#341). `PUT me/onboarding` takes `selectedPathway`, optional `birthday`, up to five `answers` (`questionNumber` 1–5, `pathway`) optional `colorMomentHue` (0–359) and optional `pathwayPreferences` (`focus` keys from the chosen pathway's page — Energy: moon-phases, my-sign, chakras, crystals; Faith: verse, prayer, reflection-question; Mindfulness: up to two of calm, rest, clarity, gratitude, self-kindness, focus — plus Mindfulness-only `checkInOpener`: none, three-breaths, one-minute), marks onboarding complete and returns the profile. User payloads use `UserProfileDto` (now with nullable `birthday`, `onboardingCompleted`, `auraRevealsEnabled` and `pathwayPreferences`) and never include `PasswordHash`. Password reset is unavailable until a verified recovery flow exists (#327). |
| Aura | `GET /api/aura/current`, `GET /api/aura/seasons` | Requires a bearer token. Current returns the derived aura (#343): OKLCH `hue` (null when there is nothing to blend), `chroma`, `lightness`, `strength` (0–1), `intensity` (0–100) and plain-language `contributors`. Seasons returns a named reflection only after the same key holds on at least 5 of 7 days with at least 4 mood logs; it also returns season history. Both respect the user's aura-reveals setting. |
| Mood | `GET/POST /api/Mood`, `GET/PUT/DELETE /api/Mood/{id}`, `GET /api/Mood/dashboard/summary`, `GET /api/Mood/dashboard/moods-by-date`, `GET /api/Mood/dashboard/mood-breakdown` | Bearer token required. |
| Mood media | `GET/POST /api/Mood/{id}/attachments`, `GET/DELETE /api/Mood/{id}/attachments/{attachmentId}`, `GET /api/Mood/{id}/attachments/{attachmentId}/content` | Bearer token required; uploads are owner-checked JPEG, PNG, or WebP images. |
| Insights | `GET /api/insights/zodiac` | Expects a token-derived user ID claim. |
| Astrology | `GET /api/astrology/birth-chart`, `GET /api/astrology/moon-mood-counts?startDate=...&endDate=...`, `GET /api/astrology/moon-cycle?startDate=...&endDate=...`, `GET /api/astrology/daily-horoscope` | Bearer token required. Date ranges are limited to 31 days. Moon-cycle dates include provider phase, illumination, optional zodiac sign, and only the signed-in user's mood counts. Birth chart access requires Astrology & Energy and explicitly saved birthday, birth time, and birthplace. Provider credentials remain server-side. |
| Faith reader | `GET /api/faith/section?framework=...&reference=...`, `GET/POST /api/faith/annotations`, `PUT/DELETE /api/faith/annotations/{id}` | Bearer token required. Sections come only from the explicitly selected provider. Annotation CRUD is owner-scoped; it stores private notes and source-version-bound offsets, not quoted source text. Migration 035 adds the annotation table. |
| Reflections | `GET /api/reflections/prompts`, `GET/POST /api/reflections/responses`, `GET /api/reflections/responses/{id}` | Bearer token required. Responses are restricted to the authenticated user's mood entries and data. |
| Reference data | `GET /api/reference-data/auras`, `GET /api/reference-data/chakras`, `GET /api/reference-data/pathways`, `GET /api/reference-data/mood-aura-mappings` | Public read-only reference data used to keep clients aligned. |
| Weather | `GET /api/Weather/current` | Public; accept `lat` + `lon`, or `city` with optional `state` and `country`. |
| Database health | `GET /health/database` | Reports readiness; Development and Staging also include environment and migration count, while Production returns only the status. |

Reflection prompts may be filtered by `pathwayKey`, `auraColorKey`, and
`chakraKey`. When a context filter is supplied, matching prompts and prompts
with no pathway/aura/chakra restriction are returned. A response must reference
an active prompt and a mood entry owned by the authenticated user.

Use Swagger for the complete current route list and request/response schemas. Authenticated routes accept `Authorization: Bearer <token>`; login returns the JWT.

Spotify account linking, current listening metadata and playlist cards are documented in [Spotify integration](../docs/spotify-integration.md), including local setup, OAuth recovery, typed API responses and token storage.

Mood requests may include `occurredAt`, an ISO timestamp with the selected UTC offset
(for example, `1998-01-01T23:30:00-08:00`), alongside `date: "1998-01-01"`.
The timestamp's local date must match `date`; the instant cannot be in the future.
The original offset is retained for timeline clocks and hour-of-day summaries.
`CreatedAt` remains the immutable server save timestamp. Migration 034 adds a nullable
`OccurredAt` column: legacy rows are not backfilled, omitted creates remain null,
and omitted same-day updates preserve any existing occurrence. A date-only edit
moves the saved wall-clock time and offset to the selected date, rejecting a
reconciled future instant before writing. It does not invent a clock for legacy
rows with no occurrence. Readers fall back to
`CreatedAt` when no occurrence was recorded. Day-based counts continue using `date`.

Mood create/update requests may include an optional `pathwayReflection` snapshot:

```json
{
  "sourceId": "chakra:root:2026-11-13:3",
  "pathway": "energy",
  "insightType": "chakra-mood-pattern",
  "text": "Would grounding feel meaningful today?",
  "response": "resonates"
}
```

The snapshot saves atomically with the mood and inherits its ownership and deletion
rules. Supported responses are `resonates`, `maybe`, and `not-for-me`; supported
insight types are `pathway-prompt`, `chakra-mood-pattern`, and `mood-combination`.
Source IDs are limited to 160 characters and invitation text to 1,500 characters.
An unanswered invitation creates no snapshot. Omitting it while editing preserves
an existing response. Migration 032 adds the nullable JSON column; existing moods
remain unanswered. The client supplies an interpretive invitation, not a verified
clinical inference or an independent provider result.

Private mood images are stored outside `wwwroot`; the SQLite migration stores
owner-scoped metadata while image bytes remain in the configured
`Storage:PrivateMediaPath` directory. Set that path to persistent private storage
for hosted environments. See [Private media attachments](../docs/private-media-attachments.md)
for supported formats, limits, routes, and storage behavior.

## Cloudflare FIT host

Cloudflare Pages hosts the web UI and its same-origin proxy functions; the API
remains an ASP.NET Core service on a separate durable host behind Cloudflare
Access and Tunnel. Run the FIT API as `Staging` with a durable FIT-only SQLite
path and private-media directory, both outside `wwwroot`. Bind only to
loopback and keep the API hostname behind an Access Service Auth policy. The
Pages Function holds the service-token credentials; they must never enter the
browser or this API repository. See the [Cloudflare FIT hosting
runbook](../docs/deployment/cloudflare-fit.md) for the deployment boundary and
verification steps.

## Tests

From the repository root:

```bash
dotnet test AuraLogbook.sln
```

For project prerequisites, frontend commands, and the combined development workflow, see the [root README](../README.md). Major dependencies and tools are inventoried in [DEPENDENCIES.md](../DEPENDENCIES.md).

## Interface screen mode

The account’s `interfaceMode` (`light` or `dark`) is separate from `interfaceTheme` and aura data. Omitted mode updates preserve the saved value. SQLite migration 022 and legacy JSON normalization convert Ivory to Aurora light. See [Interface theme and screen mode](../docs/ux/interface-screen-mode.md) for the controls, browser storage, palette and verification contracts.
