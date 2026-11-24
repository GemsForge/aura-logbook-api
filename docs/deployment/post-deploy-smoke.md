# Post-deployment smoke check

The `Deployment smoke check` workflow verifies that a deployed Aura Logbook API
has a healthy database and that the UI root page responds with HTTP 200. It is a
read-only readiness check; it does not sign in, create data, or exercise a full
user journey.

## Run it manually

In GitHub Actions, select **Deployment smoke check** → **Run workflow** and
enter the API origin and UI origin, for example:

```text
API: https://auralogbook-api.azurewebsites.net
UI:  https://aura.gemsforge.com
```

Supply origins only: no path, query, fragment, credentials, or trailing route.
The workflow checks `/health/database` on the API origin and `/` on the UI
origin. Use HTTPS for deployed endpoints.

The API may need time to wake on Azure Free F1. The smoke script retries
transient connection and server errors for up to 12 attempts, pausing 10 seconds
between attempts. It accepts only a JSON health response with
`status: "healthy"`, then requires the UI root to return HTTP 200. The script
does not print the health response body or deployment URLs to logs.

## Call it from a deployment workflow

After the API and UI deployment jobs succeed, a deployment workflow can call
the reusable workflow as its final job:

```yaml
  smoke:
    needs: [deploy-api, deploy-ui]
    uses: ./.github/workflows/deployment-smoke.yml
    with:
      api_url: ${{ vars.AZURE_API_URL }}
      ui_url: ${{ vars.AZURE_UI_URL }}
```

Keep these URL variables in the deployment configuration so the smoke step does
not depend on hard-coded hostnames.

## Health response and rollback

Production `/health/database` responses contain only `status`; Development and
Staging retain the environment and migration count for diagnostics. The
endpoint returns a generic 503 response when it cannot query the migration
table and does not return a connection string, database path, or exception
details. A healthy result also requires at least one recorded migration.

If the smoke job fails, stop further releases and inspect the API and UI
deployment logs. Restore the previous known-good deployment using the hosting
provider's deployment history, or revert the deployment commit and redeploy it.
Do not restore or overwrite the production database as a first response; take a
backup and use the documented [database recovery procedure](../database-recovery.md)
if the failure involves persisted data.
