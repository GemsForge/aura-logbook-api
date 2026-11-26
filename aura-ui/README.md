# Aura Logbook UI

React and TypeScript frontend for Aura Logbook, built with Vite. It provides account registration and login, profile setup, mood logging/history, dashboard summaries, and current weather.

## Run locally

From the repository root, use the combined launcher (recommended):

```bash
npm ci --prefix aura-ui
npm run dev
```

The UI is served at `http://localhost:58407` and the API at `http://localhost:5082`. See the [root README](../README.md) for prerequisites, port overrides, troubleshooting, and smoke testing.

To run the UI by itself:

```bash
cd aura-ui
npm ci
npm run dev
```

Vite uses the port in `vite.config.ts` (58407) and does not silently switch ports when that port is occupied.

## API configuration

The UI reads `VITE_API_BASE_URL` at build/start time. For a standalone Vite run, create an ignored `aura-ui/.env.local` file, for example:

```env
VITE_API_BASE_URL=http://localhost:5082/api
```

The combined launcher uses an exported `VITE_API_BASE_URL` first and otherwise reads `.env.local`. When either value names a local HTTP API, its port also becomes the requested API listener port. If that local port conflicts with `AURA_API_PORT` or is already occupied, startup stops with a correction message; the launcher does not silently ignore the setting or kill the listener. Restart Vite after changing the URL. Do not put credentials in frontend environment variables; values prefixed with `VITE_` are exposed to the browser.

The root launcher explicitly enables a development console toolbar for local
DEV/FIT runs. Its loopback companion owns API start/stop/restart operations and
returns only redacted synthetic-client labels to the UI. See the
[developer console guide](../docs/development-toolbar.md) for local credential
configuration and the separately gated Cloudflare FIT build.

## Production build

Production builds require `VITE_API_BASE_URL`; Vite stops with a clear error if it is missing or blank. Set it to the deployed API base URL, including `/api`, before building:

```bash
VITE_API_BASE_URL="https://api.example.com/api" npm run build
```

You can start from [`.env.example`](.env.example), copy it to an ignored file such as `.env.production.local`, and replace the example URL before running `npm run build`. The optional `VITE_PASSWORD_RESET_ENABLED` flag controls whether the recovery UI is included; it must match the API's `PasswordReset:Enabled` setting. Never place secrets in `VITE_*` values: Vite embeds them in public browser assets.

## Cloudflare FIT build

For a dedicated FIT Preview build, use `VITE_API_BASE_URL=/api`,
`VITE_AURA_DEV_TOOLBAR=true`, `VITE_AURA_ENV=FIT`, and build mode `fit`.
The test-client credentials and Access identity belong in server-side Pages
Function variables/secrets, never in Vite variables. Local API lifecycle
controls are not included in the FIT bundle. See the [developer console
guide](../docs/development-toolbar.md) for the build command and required
Function settings.

## Checks

Ensure `VITE_API_BASE_URL` is set through `.env.local` or the process environment before running the test suite. Requests are mocked, so the API does not need to be running, but RTK Query still constructs absolute request URLs.

Run from `aura-ui/`:

```bash
npm run lint
npm run test:run
npm run test:startup
npm run build
```

## Cloudflare FIT build

The Cloudflare Pages project must use the repository root so its root-level
Pages Functions are included. Build with
`npm ci --prefix aura-ui && npm run build --prefix aura-ui`, publish
`aura-ui/dist`, and set `VITE_API_BASE_URL=/api`. The Pages Function adds the
Access service token on the server and forwards the user's Aura bearer token;
never place Access credentials in a Vite variable. See the [Cloudflare FIT
hosting runbook](../docs/deployment/cloudflare-fit.md) for API host, Access,
Tunnel, bindings, verification, and rollback requirements.

See [DEPENDENCIES.md](../DEPENDENCIES.md) for major UI dependencies and [the API README](../AuraLogbook.Api/README.md) for routes and backend configuration.

## Interface screen mode

The account’s `interfaceMode` (`light` or `dark`) is separate from `interfaceTheme` and aura data. Omitted mode updates preserve the saved value. SQLite migration 022 and legacy JSON normalization convert Ivory to Aurora light. See [Interface theme and screen mode](../docs/ux/interface-screen-mode.md) for the controls, browser storage, palette and verification contracts.
