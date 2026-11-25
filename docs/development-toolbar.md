# Developer console toolbar

The toolbar is a development aid for local API lifecycle checks and FIT
synthetic-user verification. It is enabled by the combined root launcher for
local `DEV` and `FIT` runs. Normal Vite production builds omit it. A Cloudflare
Pages FIT build can include it only with Vite mode `fit` and the explicit
`VITE_AURA_DEV_TOOLBAR=true` build variable. Production mode cannot enable it.

## Local API controls

From the repository root, run:

```bash
npm run dev
```

The toolbar appears above Aura and reports API readiness. Start, stop, and
restart controls operate only the API child started by `Scripts/dev.mjs`. The
launcher exposes fixed actions over a loopback-only companion endpoint, checks
the Vite origin, and accepts no arbitrary commands or remote API targets. The
UI stays available when the API stops so it can be started again from the
toolbar. `Ctrl+C` stops both services and the companion.
The companion listens on port `58408` by default; set `AURA_DEV_CONTROL_PORT`
if that port is already used. When `VITE_API_BASE_URL=/api`, the launcher
points Vite's local proxy at its owned API child.

## Synthetic test accounts

The toolbar never creates accounts. Provision exactly two synthetic users in
the target Development or FIT data store through the supported account/setup
flow, then provide their test-only credentials to the local launcher in the
Git-ignored file `Scripts/dev-test-clients.local.json`:

```json
{
  "clients": [
    {
      "id": "synthetic-a",
      "label": "Synthetic Test Client A",
      "email": "a@example.test",
      "password": "<private test-account password>"
    },
    {
      "id": "synthetic-b",
      "label": "Synthetic Test Client B",
      "email": "b@example.test",
      "password": "<private test-account password>"
    }
  ]
}
```

Use fictional values and reserved example domains only. The launcher validates
both entries, keeps email/password values in its server process, and returns
only IDs and test labels to the UI. Selecting a client calls Aura's ordinary
`POST /api/Auth/login` route through the helper, then hydrates the returned
session. Before switching, the UI clears all RTK Query API caches and the
previous authentication state. Credentials, JWTs, and journal content are not
written to fixtures or helper logs. The local config file is not needed unless
test sign-in is being exercised.

## FIT Pages configuration

Use a Preview/FIT deployment, not a Production build. In the Pages project,
configure the Preview build variables:

| Name | FIT Preview value |
| --- | --- |
| `AURA_BUILD_MODE` | `fit` |
| `VITE_API_BASE_URL` | `/api` |
| `VITE_AURA_DEV_TOOLBAR` | `true` |
| `VITE_AURA_ENV` | `FIT` |

Use this Pages build command so normal production deployments remain excluded
by default:

```bash
npm ci --prefix aura-ui && npm run build --prefix aura-ui -- --mode "${AURA_BUILD_MODE:-production}"
```

In the Preview/FIT **Functions** environment only, set `AURA_ENV=FIT` and
`AURA_DEV_TOOLBAR_ENABLED=true`. Add
`AURA_DEV_TEST_CLIENTS_JSON` as an encrypted secret containing the same two
synthetic account entries. Never put emails or passwords in `VITE_*` values.
The existing server-side `API_TUNNEL_URL` and Access service-token bindings
must already point to the isolated FIT API. The Pages Functions expose only
readiness, a redacted synthetic-client list, and ordinary API login for a
configured synthetic ID. They return 404 outside explicitly enabled FIT and
do not expose local process controls remotely.

For Production, build in `production` mode, set
`VITE_AURA_DEV_TOOLBAR=false`, and leave all developer-only Function variables
and secrets unset. Do not use the toolbar or test-account selector with
Production data or credentials.

## Verification

- Confirm normal `npm run build` output contains no developer toolbar code.
- Build with `AURA_BUILD_MODE=fit`, `VITE_AURA_DEV_TOOLBAR=true`,
  `VITE_AURA_ENV=FIT`, and `VITE_API_BASE_URL=/api`; confirm the FIT toolbar
  appears and the API lifecycle controls are absent.
- Exercise local start/stop/restart, unexpected API exit, and health readiness.
- Exercise each synthetic FIT account through normal Aura sign-in and confirm
  that switching clears prior user query data.
- Confirm invalid config fails closed and no credentials, bearer tokens, or
  journal values appear in generated assets, responses, or logs.
- Verify keyboard access to every control and announcement of API and request
  states.

Cloudflare account resources, Access, Tunnel, and durable FIT storage are
tracked in issues [#477](https://github.com/GemsForge/aura-logbook-api/issues/477),
[#478](https://github.com/GemsForge/aura-logbook-api/issues/478),
[#483](https://github.com/GemsForge/aura-logbook-api/issues/483),
[#484](https://github.com/GemsForge/aura-logbook-api/issues/484), and
[#485](https://github.com/GemsForge/aura-logbook-api/issues/485).
