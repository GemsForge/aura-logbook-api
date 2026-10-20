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

## Checks

Ensure `VITE_API_BASE_URL` is set through `.env.local` or the process environment before running the test suite. Requests are mocked, so the API does not need to be running, but RTK Query still constructs absolute request URLs.

Run from `aura-ui/`:

```bash
npm run lint
npm run test:run
npm run test:startup
npm run build
```

See [DEPENDENCIES.md](../DEPENDENCIES.md) for major UI dependencies and [the API README](../AuraLogbook.Api/README.md) for routes and backend configuration.
