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

The combined launcher sets this value to the selected local API URL unless an exported `VITE_API_BASE_URL` overrides it; it warns and ignores a conflicting `.env.local` value for that combined run. Restart Vite after changing the URL. Do not put credentials in frontend environment variables; values prefixed with `VITE_` are exposed to the browser.

## Checks

Run from `aura-ui/`:

```bash
npm run lint
npm run test:run
npm run test:startup
npm run build
```

See [DEPENDENCIES.md](../DEPENDENCIES.md) for major UI dependencies and [the API README](../AuraLogbook.Api/README.md) for routes and backend configuration.
