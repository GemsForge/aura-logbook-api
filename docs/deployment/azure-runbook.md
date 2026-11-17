# Azure First-Deployment Runbook

<!-- Owner-run guide for issue #449. It names settings only; never paste secret values into this file, issues, or PRs. -->

This guide sets up a free Azure home for Aura Logbook: the API on Azure App
Service (Free F1, Linux, .NET 9) and the website on Azure Static Web Apps
(Free). You perform every portal step; secret values stay in Azure and GitHub.

Non-goals: custom domains, paid tiers, containers.

> The Free F1 plan sleeps when idle (the first request is slow) and has daily
> CPU limits. That is acceptable for this portfolio app.

## Before you start

- An Azure account and the Azure portal (<https://portal.azure.com>).
- Admin access to the `GemsForge/aura-logbook` GitHub repository.
- Your Spotify Developer Dashboard app.
- Your FreeAstroAPI key (and optionally a FreeAstrologyAPI key).

Pick names now and use them throughout (examples):

| Item | Example name |
| --- | --- |
| Resource group | `rg-auralogbook` |
| App Service (API) | `auralogbook-api` → `https://auralogbook-api.azurewebsites.net` |
| Static Web App (UI) | `auralogbook-ui` → `https://<generated>.azurestaticapps.net` |

## 1. Create the resource group

1. Portal → **Resource groups** → **Create**.
2. Subscription: yours. Name: `rg-auralogbook`. Region: one close to you
   (use the same region for everything below).
3. **Review + create** → **Create**.

_Screenshot placeholder: resource group overview._

## 2. Create the API (App Service, Free F1)

1. Portal → **App Services** → **Create** → **Web App**.
2. Resource group: `rg-auralogbook`. Name: `auralogbook-api`.
3. Publish: **Code**. Runtime stack: **.NET 9 (STS)**. OS: **Linux**.
4. Pricing plan: create a new Linux plan and choose **Free F1**.
5. **Review + create** → **Create**.
6. Open the app → **Settings → Configuration → General settings**: confirm
   the stack is .NET 9. Leave **Always On** off (not available on F1).

_Screenshot placeholder: App Service overview showing the default domain._

`/home` is the App Service persistent storage, so the database and private
media live under `/home/data`. Run a single instance only (SQLite allows one
writer).

## 3. Create the website (Static Web Apps, Free)

1. Portal → **Static Web Apps** → **Create**.
2. Resource group: `rg-auralogbook`. Name: `auralogbook-ui`. Plan: **Free**.
3. Deployment source: **Other** (the GitHub Actions workflow from #450 will
   deploy it; do not let the portal generate a workflow).
4. **Review + create** → **Create**.
5. Copy the generated URL (`https://<generated>.azurestaticapps.net`). This
   is the **UI origin** used below.

_Screenshot placeholder: Static Web App overview showing the URL._

## 4. Enter API app settings

App Service `auralogbook-api` → **Settings → Environment variables → App
settings** → add each name below → **Apply** → confirm the restart.

| Name | Value source |
| --- | --- |
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `Jwt__Key` | New random value: run `openssl rand -base64 48` locally |
| `Spotify__ClientId` | Spotify Developer Dashboard |
| `Spotify__ClientSecret` | Spotify Developer Dashboard (secret) |
| `Spotify__RedirectUri` | `https://auralogbook-api.azurewebsites.net/api/spotify/callback` |
| `FREE_ASTRO_API_KEY` | FreeAstroAPI dashboard (secret) |
| `FreeAstrologyApi__ApiKey` | Optional, FreeAstrologyAPI dashboard (secret) |
| `Database__ConnectionString` | `Data Source=/home/data/auralogbook.db` |
| `Storage__PrivateMediaPath` | `/home/data/private-media` |
| `Cors__AllowedOrigins__0` | The UI origin from step 3 (scheme + host, no path, no trailing slash) |

Notes:

- The API refuses to start without `Cors__AllowedOrigins__0` or with an empty
  `Storage__PrivateMediaPath`.
- Never reuse the local or staging `Jwt__Key`.
- See `docs/configuration-and-secrets.md` and `docs/runtime-environments.md`
  for what each setting does.

_Screenshot placeholder: App settings list with values hidden._

## 5. Register the live Spotify redirect URL

1. Spotify Developer Dashboard → your app → **Settings** → **Redirect URIs**.
2. Add `https://auralogbook-api.azurewebsites.net/api/spotify/callback`
   exactly as entered in `Spotify__RedirectUri` → **Save**.

## 6. Copy deploy credentials into GitHub secrets

1. App Service `auralogbook-api` → **Overview** → **Download publish
   profile**. (If the button is disabled, enable **Settings → Configuration →
   General settings → SCM Basic Auth Publishing Credentials** first.)
2. Static Web App `auralogbook-ui` → **Overview** → **Manage deployment
   token** → copy.
3. GitHub → `aura-logbook` → **Settings → Secrets and variables → Actions**:
   - Secret `AZURE_API_PUBLISH_PROFILE` = full contents of the publish profile file.
   - Secret `AZURE_SWA_TOKEN` = the deployment token.
   - Variable `VITE_API_BASE_URL` = `https://auralogbook-api.azurewebsites.net/api`
     (public build setting used by #450).
4. Delete the downloaded publish profile file from your computer.

## Verification checklist

- [ ] Resource group `rg-auralogbook` exists.
- [ ] App Service (Free F1, Linux, .NET 9) exists.
- [ ] Static Web App (Free) exists and its URL is recorded.
- [ ] All app settings in step 4 are entered (names reviewed; values never shared).
- [ ] Spotify redirect URI registered and matching.
- [ ] GitHub secrets `AZURE_API_PUBLISH_PROFILE` and `AZURE_SWA_TOKEN` added.
- [ ] GitHub variable `VITE_API_BASE_URL` added.
- [ ] No secret values appear in the repo, issues, or PRs.

To have the setting names checked, share only the **names** from step 4 (for
example a screenshot with values hidden).

## Rotating or recovering

- Rotate a secret: change it in Azure (or GitHub), then restart the API.
  Rotating `Jwt__Key` signs everyone out.
- Reset the publish profile: App Service → **Reset publish profile**, then
  update `AZURE_API_PUBLISH_PROFILE`.
- Reset the SWA token: **Manage deployment token** → **Reset**, then update
  `AZURE_SWA_TOKEN`.
- Database backups and restore: see `docs/database-recovery.md`.
