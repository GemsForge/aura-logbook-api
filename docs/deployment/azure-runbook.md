# Azure First-Deployment Runbook

<!-- Owner-run guide for issue #449. It names settings only; never paste secret values into this file, issues, or PRs. -->

This guide sets up a free Azure home for Aura Logbook: the API on Azure App
Service (Free F1, Linux, .NET 10 LTS) and the website on Azure Static Web Apps
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

A resource group is a folder that holds everything for this app.

1. Portal search bar → type **Resource groups** → open it → **+ Create**.
2. **Basics** tab:
   - **Subscription:** `Azure subscription 1` (your free subscription).
   - **Resource group name:** `rg-auralogbook`
   - **Region:** `(US) East US`. Write it down; use it for everything below.
3. Skip **Tags**. Click **Review + create** → wait for "Validation passed" →
   **Create**.
4. Wait for the "Resource group created" notification (bell icon, top right).

_Screenshot placeholder: resource group overview._

## 2. Create the API (App Service, Free F1)

1. Portal search bar → **App Services** → **+ Create** → **Web App**.
2. **Basics** tab, **Project details**:
   - **Subscription:** `Azure subscription 1`.
   - **Resource Group:** `rg-auralogbook`.
3. **Basics** tab, **Instance details**:
   - **Name:** `auralogbook-api` (must be globally unique; if taken, add a
     suffix such as `auralogbook-api-gf` and use that name everywhere below).
   - If the portal shows no hostname toggle and a random suffix appears under the name (for example `-abc123.westus3-01.azurewebsites.net`), that is expected: use that full address everywhere this guide says `auralogbook-api.azurewebsites.net`.
   - **Secure unique default hostname:** turn **off** so the address is the
     simple `https://<name>.azurewebsites.net`. (If you leave it on, Azure
     adds random characters; then copy the real **Default domain** from the
     Overview page and use it wherever this guide says
     `auralogbook-api.azurewebsites.net`.)
   - **Publish:** `Code`.
   - **Runtime stack:** `.NET 10 (LTS)`. .NET 9 is no longer offered (support ended November 2026); the API must target `net10.0` first (issue #461).
   - **Operating System:** `Linux`.
   - **Region:** any region offering Free F1 (for example `East US` or `West US 3`). It need not match the resource group; use a nearby region for the Static Web App too.
4. **Basics** tab, **Pricing plans**:
   - **Linux Plan:** **Create new** → name `asp-auralogbook` → **OK**.
   - **Pricing plan:** click **Explore pricing plans** → **Dev/Test** →
     select **Free F1** (shows $0) → **Select**. Do not keep the default
     (Basic/Premium cost money).
   - **Zone redundancy:** Disabled (or not shown on F1).
5. **Database** tab (if shown): leave unchecked. The app uses its own SQLite file.
6. **Deployment** tab: **Basic authentication:** `Enable` (required for the publish profile in step 6).
   **Continuous deployment:** `Disable`. A warning may say
   GitHub Actions setup is not supported for this OS and plan; that is
   expected. The portal wizard cannot generate a workflow on Linux Free F1,
   but GitHub Actions still works: the repository workflow from #450 builds,
   tests, and deploys with the `AZURE_API_PUBLISH_PROFILE` secret (step 6),
   and keeps the workflow under the repository CI and commit policies.
7. **Networking** tab: **Enable public access:** `On`. Leave the rest.
8. **Monitoring + secure** tab: **Enable Application Insights:** `No`
   (avoids possible charges). Leave Defender off.
9. Skip **Tags**. **Review + create** → confirm the summary says **Free F1**,
   **Linux**, **.NET 10 (LTS)** → **Create**.
10. When deployment finishes → **Go to resource**. On **Overview**, copy the
    **Default domain** (for example `auralogbook-api.azurewebsites.net`).
11. Left menu → **Settings → Configuration → General settings**:
    - **Stack settings:** .NET, version 10 (LTS).
    - **SCM Basic Auth Publishing Credentials:** `On` (needed to download the
      publish profile in step 6). **Save**.
    - **Always on** is unavailable on F1; that is expected.

`/home` is App Service persistent storage, so the database and private
media live under `/home/data`. Keep **Scale out** at 1 instance (SQLite
allows one writer).

_Screenshot placeholder: App Service overview showing the default domain._

## 3. Create the website (Static Web Apps, Free)

1. Portal search bar → **Static Web Apps** → **+ Create**.
2. **Basics** tab:
   - **Subscription:** `Azure subscription 1`.
   - **Resource Group:** `rg-auralogbook`.
   - **Name:** `auralogbook-ui`.
   - **Plan type:** `Free`.
   - **Source** (Deployment details): **Other**. Do not pick GitHub; the
     portal would commit its own workflow. The #450 workflow deploys with a
     token instead.
3. **Advanced** tab (if shown): region for staging/API features → `East US 2`
   (or the closest offered). This does not cost anything on Free.
4. Skip **Tags**. **Review + create** → confirm **Plan: Free** → **Create**.
5. **Go to resource**. On **Overview**, copy the **URL**
   (`https://<generated>.azurestaticapps.net`). This is the **UI origin**
   used in step 4.

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
- [ ] App Service (Free F1, Linux, .NET 10 LTS) exists.
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
