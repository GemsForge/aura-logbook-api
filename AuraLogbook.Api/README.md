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
- Provide a private `Jwt:Key` in user secrets or the deployment environment; do not commit signing keys or provider credentials. `Jwt:Issuer` and `Jwt:Audience` must match the values used by token validation.
- Development and Staging register the SQLite user, mood, zodiac-insight, and reflection repositories. `Database:ConnectionString` selects the database, and startup applies every versioned SQL migration not already recorded in `__SchemaMigrations`.
- Development can import users from the configured `Storage:UserFilePath` when `Database:SeedUsersOnStartup` is enabled. The broader JSON files remain import/audit sources; they are not the active Development repository.
- Production currently selects the legacy file repositories for users, moods, and zodiac insights, while reflection storage and migration startup still use SQLite. A production deployment therefore needs an explicit, tested storage decision rather than assuming Development's local database or the fallback files are production-ready.
- The dashboard weather endpoint uses Open-Meteo's forecast and geocoding APIs and requires no API key for the project's current development use. See [DEPENDENCIES.md](../DEPENDENCIES.md) for attribution, limits, and terms.

## API surface

Controllers use the `/api` prefix. Key routes include:

| Area | Routes | Authentication |
| --- | --- | --- |
| Auth | `POST /api/Auth/register`, `POST /api/Auth/login`, `GET /api/Auth/me`, `PUT /api/Auth/update`, `GET /api/Auth/all` | Register and login are public; the other listed routes require a bearer token. |
| Mood | `GET/POST /api/Mood`, `GET/PUT/DELETE /api/Mood/{id}`, `GET /api/Mood/dashboard/summary`, `GET /api/Mood/dashboard/moods-by-date`, `GET /api/Mood/dashboard/mood-breakdown` | Bearer token required. |
| Insights | `GET /api/insights/zodiac` | Expects a token-derived user ID claim. |
| Reflections | `GET /api/reflections/prompts`, `GET/POST /api/reflections/responses`, `GET /api/reflections/responses/{id}` | Bearer token required. Responses are restricted to the authenticated user's mood entries and data. |
| Reference data | `GET /api/reference-data/auras`, `GET /api/reference-data/chakras`, `GET /api/reference-data/pathways`, `GET /api/reference-data/mood-aura-mappings` | Public read-only reference data used to keep clients aligned. |
| Weather | `GET /api/Weather/current` | Public; accept `lat` + `lon`, or `city` with optional `state` and `country`. |
| Database health | `GET /health/database` | Reports resolved environment and applied migration count without connection details. |

Reflection prompts may be filtered by `pathwayKey`, `auraColorKey`, and
`chakraKey`. When a context filter is supplied, matching prompts and prompts
with no pathway/aura/chakra restriction are returned. A response must reference
an active prompt and a mood entry owned by the authenticated user.

Use Swagger for the complete current route list and request/response schemas. Authenticated routes accept `Authorization: Bearer <token>`; login returns the JWT.

## Tests

From the repository root:

```bash
dotnet test AuraLogbook.sln
```

For project prerequisites, frontend commands, and the combined development workflow, see the [root README](../README.md). Major dependencies and tools are inventoried in [DEPENDENCIES.md](../DEPENDENCIES.md).
