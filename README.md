# Aura Logbook

Aura Logbook is a mood-tracking application with a .NET 9 / ASP.NET Core API and a separate React, TypeScript, and Vite UI. The API currently stores user, mood, and zodiac insight records in JSON files for local development.

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

The launcher sends the UI to the selected API base URL (`http://localhost:5082/api` by default). An exported `VITE_API_BASE_URL` takes precedence; a conflicting `aura-ui/.env.local` value is warned about and ignored for the combined run. The `.env.local` file is ignored by Git and is used normally when running Vite by itself.

To use different local ports, set `AURA_API_PORT` and/or `AURA_UI_PORT` before starting the launcher. If using a non-default API port, the launcher builds the corresponding API base URL. An explicit exported `VITE_API_BASE_URL` still takes precedence.

## Run each service separately

API, from `AuraLogbook.Api/`:

```bash
dotnet run --launch-profile http
```

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

The combined launcher orchestration tests run from the repository root:

```bash
node --test Scripts/dev.test.mjs
```

## Troubleshooting

- **Port already in use:** The launcher uses strict port binding and does not kill unrelated processes. Identify and stop the existing listener, or choose another port with `AURA_API_PORT` / `AURA_UI_PORT`.
- **UI reports an API/network error:** Check that the API is running, then verify the UI is targeting the matching `<API URL>/api`. The combined launcher prints a warning if `.env.local` conflicts; an exported `VITE_API_BASE_URL` overrides the default.
- **UI dependencies missing:** Run `npm ci` in `aura-ui/` (or `npm ci --prefix aura-ui` at the root).
- **JWT or authentication fails:** Ensure a private `Jwt:Key` is configured and that the token was issued by the current API configuration. `GET /api/Auth/me` and mood routes require a valid bearer token; register or log in again after changing the signing key.
- **Weather unavailable:** `GET /api/Weather/current` uses Open-Meteo geocoding and forecast endpoints. No API key is needed for local development. Check API logs and provider connectivity; see [DEPENDENCIES.md](DEPENDENCIES.md) for service terms and attribution.

Manual smoke test: run `npm run dev`, open the UI and Swagger URLs above, verify the UI reaches the local API, then press Ctrl+C and confirm both services stop.

## Project documentation

- [API setup, configuration, routes, and tests](AuraLogbook.Api/README.md)
- [UI setup, API URL configuration, and checks](aura-ui/README.md)
- [Major dependencies, tools, and external-service terms](DEPENDENCIES.md)
- [Safe local and remote branch cleanup](BRANCH_CLEANUP.md)
- [Repository issue and pull-request workflow](.github/ISSUE_WORKFLOW.md)

## License

MIT. See [LICENSE](LICENSE).
