# Project Dependencies and Tools

This is a maintained overview of the project's major runtime dependencies, external services, and development tools. The manifests are authoritative for exact package versions and transitive dependencies. For setup and run instructions, see the [root README](README.md).

- Backend: `AuraLogbook.Api/AuraLogbook.Api.csproj`
- Backend tests: `AuraLogbook.Api.Tests/AuraLogbook.Api.Tests.csproj`
- Frontend: `aura-ui/package.json` and `aura-ui/package-lock.json`

## Runtime and build platforms

| Area | Dependency/tool | Purpose |
| --- | --- | --- |
| Backend | .NET 9 (`net9.0` target) / ASP.NET Core | Web API host, controllers, dependency injection, configuration, logging, and HTTP client infrastructure. |
| Frontend | React 19 and React DOM | Browser UI and rendering. |
| Frontend build | Node.js 20 in GitHub Actions; npm | Frontend package installation, tests, lint, and builds. |
| Frontend bundler | Vite 6 | Development server and production asset bundling. |
| Source control automation | GitHub Actions | Pull-request policies, issue/PR metadata synchronization, and UI validation. |

Use a .NET 9 SDK locally to match the backend target. The UI CI currently pins Node.js 20 and installs from the committed npm lockfile with `npm ci`.

## Backend packages

Direct package references declared by `AuraLogbook.Api.csproj`:

| Package | Declared version | Role / status |
| --- | --- | --- |
| `Microsoft.AspNetCore.Authentication.JwtBearer` | `8.0.17` | Bearer-token authentication for the API's JWT-protected routes. |
| `Swashbuckle.AspNetCore` | `6.6.2` | Swagger/OpenAPI document and development UI. |
| `BCrypt.Net-Next` | `4.0.3` | Password hashing and verification. |
| `Dapper` | `2.1.66` | SQL mapping package; no active Dapper usage was found in the current API source during this inventory. |
| `Microsoft.Data.Sqlite.Core` | `9.0.6` | SQLite provider; current registered repositories use JSON files, not a configured SQLite database. |
| `SQLitePCLRaw.bundle_e_sqlite3` | `2.1.11` | Native SQLite bundle, initialized by the API host; database use should be confirmed before removing. |

The API currently registers file-backed repositories for users, moods, and zodiac insights. Their configured data files are under `AuraLogbook.Api/Data/`. Dapper/SQLite packages appear to be retained or legacy infrastructure; this document records them but does not remove them.

## Frontend runtime packages

Declared application dependencies in `aura-ui/package.json`:

| Package(s) | Purpose |
| --- | --- |
| `@mui/material`, `@mui/joy`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled` | Material UI and Joy UI components, icons, and styling. |
| `@mui/x-date-pickers`, `dayjs` | Date selection and date formatting. |
| `react-router-dom` | Client-side routing. |
| `@reduxjs/toolkit`, `react-redux` | Application state and API query state. |
| `axios` | HTTP client for backend requests. |
| `recharts` | Mood and dashboard charts. |
| `react-hook-form`, `@hookform/resolvers`, `yup` | Form state, resolver integration, and schema validation. |

Declared versions/ranges are maintained in `aura-ui/package.json`; `package-lock.json` resolves the installed dependency tree.

## Test, lint, and frontend tooling

| Tool/package | Purpose |
| --- | --- |
| `Microsoft.NET.Test.Sdk` `17.8.0` | .NET test runner integration. |
| `xunit` `2.9.3`, `xunit.runner.visualstudio` `3.1.4` | Backend unit tests and Visual Studio test adapter. |
| `Moq` `4.20.72` | Backend test doubles. |
| TypeScript `~5.8.3` | Frontend static type checking. |
| Vitest `^4.1.7`, jsdom `^29.1.1` | Frontend test runner and browser-like test environment. |
| `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` | UI behavior and DOM assertions in component tests. |
| ESLint `^9.25.0`, typescript-eslint, React Hooks and React Refresh plugins | Frontend linting and React/TypeScript rules. |
| `@vitejs/plugin-react`, `vite-tsconfig-paths` | Vite React integration and TypeScript path resolution. |
| PostCSS, Autoprefixer, Tailwind CSS | CSS processing and utility styling. |
| Jest, ts-jest, ts-node, `@types/jest` | Also declared in the frontend toolchain; verify whether still needed as the UI test suite uses Vitest. |

Useful frontend commands, run from `aura-ui/`:

```bash
npm ci
npm run lint
npm run test:run
npm run test:startup
npm run build
```

Backend validation uses the .NET CLI, from the repository root:

```bash
dotnet test AuraLogbook.sln
dotnet build AuraLogbook.sln
node --test Scripts/dev.test.mjs
```

## External runtime services

### Open-Meteo weather API

- **Purpose:** Current weather conditions used by the dashboard.
- **Provider:** [Open-Meteo](https://open-meteo.com/)
- **Forecast endpoint:** `https://api.open-meteo.com/v1/forecast`
- **Geocoding endpoint:** `https://geocoding-api.open-meteo.com/v1/search`
- **Credentials:** No key is needed for the free/open-access endpoint.
- **Data requested:** Current temperature, WMO weather code, and day/night status; temperature is requested in Fahrenheit. City input is resolved to coordinates using geocoding.
- **License and attribution:** Weather data is provided under CC BY 4.0. Attribute Open-Meteo and identify modifications when redistributing data. See [Open-Meteo's terms](https://open-meteo.com/en/terms).
- **Free-use terms:** Non-commercial use only, with limits of fewer than 10,000 calls/day, 5,000/hour, and 600/minute; no uptime guarantee. Check current [terms](https://open-meteo.com/en/terms) and [pricing](https://open-meteo.com/en/pricing) before deployment.
- **Commercial use:** Ads, subscriptions, or other commercial use require an appropriate paid plan or a provider whose license permits that use.

The project currently uses this service for personal development. Before public deployment, ensure user-facing attribution is displayed and recheck that the app's use remains within the provider's current terms.

## Configuration and data

- Backend settings are loaded from `AuraLogbook.Api/appsettings.json`, environment-specific settings, environment variables, and .NET user secrets. The API project uses the user-secrets ID `AuraLogbook.Api`; configure private signing keys outside source control. See the [API README](AuraLogbook.Api/README.md).
- Frontend API base URL is configured with `VITE_API_BASE_URL`. Vite uses port 58407; the combined launcher defaults the API to port 5082 and aligns the UI URL. See the [root README](README.md) and [UI README](aura-ui/README.md).
- The current repositories persist user, mood, and zodiac insight data in JSON files. Treat those files as application data, not package dependencies.

## Maintenance notes

- Keep package version changes in the relevant project manifest and lockfile; update this document when a major dependency or service changes.
- Confirm whether Dapper/SQLite and Jest-related frontend packages are still needed before removing them; this inventory is not authorization to remove dependencies.
- This file summarizes direct and operational dependencies. It is not a software bill of materials and does not enumerate transitive packages or license texts.
