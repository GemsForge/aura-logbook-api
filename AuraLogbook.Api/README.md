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
- `Storage` configures the JSON files for users, moods, and zodiac insights. The application currently uses file-backed repositories; data is local to the configured files and is not a shared production database.
- The dashboard weather endpoint uses Open-Meteo's forecast and geocoding APIs and requires no API key for the project's current development use. See [DEPENDENCIES.md](../DEPENDENCIES.md) for attribution, limits, and terms.

## API surface

Controllers use the `/api` prefix. Key routes include:

| Area | Routes | Authentication |
| --- | --- | --- |
| Auth | `POST /api/Auth/register`, `POST /api/Auth/login`, `GET /api/Auth/me`, `PUT /api/Auth/update`, `GET /api/Auth/all` | Register and login are public; the other listed routes require a bearer token. |
| Mood | `GET/POST /api/Mood`, `GET/PUT/DELETE /api/Mood/{id}`, `GET /api/Mood/dashboard/summary`, `GET /api/Mood/dashboard/moods-by-date`, `GET /api/Mood/dashboard/mood-breakdown` | Bearer token required. |
| Insights | `GET /api/insights/zodiac` | Expects a token-derived user ID claim. |
| Reflections | `GET /api/reflections/prompts`, `GET/POST /api/reflections/responses`, `GET /api/reflections/responses/{id}` | Bearer token required. Responses are restricted to the authenticated user's mood entries and data. |
| Weather | `GET /api/Weather/current` | Public; accept `lat` + `lon`, or `city` with optional `state` and `country`. |

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
