# Aura Logbook

Aura Logbook is a mood-tracking and reflective-journaling application with a .NET 9 / ASP.NET Core API and a separate React, TypeScript, and Vite UI. Development and FIT/Staging use SQLite through Dapper with versioned startup migrations. The committed JSON files are retained as import and local-development seed sources rather than the active Development data store.

## Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js 20 or newer](https://nodejs.org/) and npm
- Git

## First-time setup

From the repository root:

```bash
dotnet restore AuraLogbook.sln
npm ci --prefix aura-ui
```

The API project has a .NET user-secrets ID (`AuraLogbook.Api`). Configure a private JWT signing key for local development before registering/logging in:

```bash
dotnet user-secrets --project AuraLogbook.Api/AuraLogbook.Api.csproj set "Jwt:Key" "<your-random-secret>"
```

Use a private random value of at least 32 bytes. Do not commit secrets or paste them into frontend configuration. `Jwt:Issuer` and `Jwt:Audience` default to the values in `AuraLogbook.Api/appsettings.json`.

## Run API and UI together

From the repository root:

```bash
npm run dev
```

This starts the API and UI together, prefixes their output with `[API]` and `[UI]`, and stops the sibling service if one exits or fails to start. Press **Ctrl+C** once to stop both services.

| Service | Local URL |
| --- | --- |
| UI | [http://localhost:58407](http://localhost:58407) |
| API base | [http://localhost:5082/api](http://localhost:5082/api) |
| Swagger (Development only) | [http://localhost:5082/swagger](http://localhost:5082/swagger) |

The launcher keeps the local API listener and the UI's API target aligned. By default, both the listener and that target use API port `5082`; the UI itself uses port `58407`. When `aura-ui/.env.local` or an exported `VITE_API_BASE_URL` points to a local HTTP API, the launcher uses that URL's port for the API listener too. An explicit `AURA_API_PORT` must match a local `VITE_API_BASE_URL`; conflicting values stop startup with instructions to align them. The `.env.local` file is ignored by Git and is used normally when running Vite by itself.

To use different local ports, set `AURA_API_PORT` and/or `AURA_UI_PORT` before starting the launcher. For example, set `AURA_API_PORT=5124` and `VITE_API_BASE_URL=http://localhost:5124/api` together. If the default API port is occupied, the launcher automatically selects the next available local API port and updates the UI base URL to match. An explicitly configured, occupied port (through `AURA_API_PORT` or a local `VITE_API_BASE_URL`) fails with the exact port and recovery options; the launcher never kills unrelated listeners. A `VITE_API_BASE_URL` that points to a remote host continues to be a UI-only override.

## Run each service separately

API, from `AuraLogbook.Api/`:

```bash
dotnet run --launch-profile http
```

## Runtime environments

Aura Logbook uses these environment aliases:

| Alias | ASP.NET Core environment | Purpose |
|---|---|---|
| `DEV` | `Development` | Local development database and JSON user seeding |
| `FIT` | `Staging` | Feature/integration testing with isolated staging data |
| `PRO` | `Production` | Production configuration; startup seeding disabled |

Run the API with an alias by setting `ASPNETCORE_ENVIRONMENT`:

```bash
ASPNETCORE_ENVIRONMENT=Development dotnet run --project AuraLogbook.Api
ASPNETCORE_ENVIRONMENT=Staging dotnet run --project AuraLogbook.Api
ASPNETCORE_ENVIRONMENT=Production dotnet run --project AuraLogbook.Api
```

For the combined API and UI launcher, use `AURA_ENV`:

```bash
AURA_ENV=DEV npm run dev
AURA_ENV=FIT npm run dev
AURA_ENV=PRO npm run dev
```

The API logs the resolved ASP.NET Core environment and whether startup user
seeding is enabled. `appsettings.json` loads first, followed by the matching
environment file; later environment variables and command-line settings can
override both.

See [Runtime environments](docs/runtime-environments.md) for the complete
configuration and database seeding guide.

## Relational database workflow

The Development and FIT/Staging environments use SQLite with versioned SQL
migrations. The API applies pending migrations at startup and records them in
`__SchemaMigrations`. To import the complete active JSON dataset into a clean
development database, use the [database seeder](Scripts/DatabaseSeeder/README.md).

The seeder writes a reconciliation report containing source and stored counts.
Keep the JSON files unchanged as the migration and audit source; the relational
database is the runtime source for Development and FIT/Staging.

For FIT/Staging diagnostics, use `GET /health/database`. To deliberately reset
only the staging database, run `AURA_ENV=FIT node Scripts/reset-staging-db.mjs
--confirm`; the script refuses ambiguous environment or confirmation settings.

UI, from `aura-ui/` (run `npm ci` there first):

```bash
npm run dev
```

For standalone UI development, set `VITE_API_BASE_URL=http://localhost:5082/api` in `aura-ui/.env.local`. Vite is configured for port 58407 with strict-port behavior.

## Tests and build

Run API tests from the repository root:

```bash
dotnet test AuraLogbook.sln
```

Run UI checks from `aura-ui/`:

```bash
npm run lint
npm run test:run
npm run test:startup
npm run build
```

Before `test:run`, provide a valid `VITE_API_BASE_URL` through `aura-ui/.env.local` or the process environment; the API does not need to be running because the tests mock requests, but the client still constructs absolute request URLs.

The combined launcher orchestration tests run from the repository root:

```bash
node --test Scripts/dev.test.mjs
```

## Troubleshooting

- **Port already in use:** The launcher reports the exact port. For an automatically selected default, it moves to the next available API port and updates the UI target. For an explicit local API URL or `AURA_API_PORT`, stop the process using that port or choose another port and keep the settings aligned; the launcher never kills unrelated processes.
- **UI reports an API/network error:** Check that the API is running and that local `VITE_API_BASE_URL` and `AURA_API_PORT` use the same port. The combined launcher derives the API listener port from a local `VITE_API_BASE_URL`; if both settings are provided but conflict, correct one before restarting.
- **UI dependencies missing:** Run `npm ci` in `aura-ui/` (or `npm ci --prefix aura-ui` at the root).
- **JWT or authentication fails:** Ensure a private `Jwt:Key` is configured and that the token was issued by the current API configuration. `GET /api/Auth/me` and mood routes require a valid bearer token; register or log in again after changing the signing key.
- **Weather unavailable:** `GET /api/Weather/current` uses Open-Meteo geocoding and forecast endpoints. No API key is needed for local development. Check API logs and provider connectivity; see [DEPENDENCIES.md](DEPENDENCIES.md) for service terms and attribution.

Manual smoke test: run `npm run dev`, open the UI and Swagger URLs above, verify the UI reaches the local API, then press Ctrl+C and confirm both services stop.

## Project documentation

- [Documentation index: current guidance and historical sources](docs/README.md)
- [Product purpose and current direction](AURA_PROJECT_OVERVIEW.md)
- [API setup, configuration, routes, and tests](AuraLogbook.Api/README.md)
- [UI setup, API URL configuration, and checks](aura-ui/README.md)
- [SwiftUI shell adaptation plan](docs/ux/swiftui-shell-adaptation.md)
- [Major dependencies, tools, and external-service terms](DEPENDENCIES.md)
- [Safe local and remote branch cleanup](BRANCH_CLEANUP.md)
- [Repository issue and pull-request workflow](.github/ISSUE_WORKFLOW.md)

## License

MIT. See [LICENSE](LICENSE).
