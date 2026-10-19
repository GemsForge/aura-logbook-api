# Runtime environments

Aura Logbook uses ASP.NET Core environment names to select configuration.

## Environment aliases

| Alias | ASP.NET Core name | Purpose | User seeding |
|---|---|---|---|
| `DEV` | `Development` | Local development | Enabled |
| `FIT` | `Staging` | Feature and integration testing | Disabled |
| `PRO` | `Production` | Production deployment | Disabled |

Run the combined API and UI launcher with:

```bash
AURA_ENV=DEV npm run dev
AURA_ENV=FIT npm run dev
AURA_ENV=PRO npm run dev
```

For the API alone, use the resolved ASP.NET Core name:

```bash
ASPNETCORE_ENVIRONMENT=Development dotnet run --project AuraLogbook.Api
ASPNETCORE_ENVIRONMENT=Staging dotnet run --project AuraLogbook.Api
ASPNETCORE_ENVIRONMENT=Production dotnet run --project AuraLogbook.Api
```

## Configuration loading

Configuration is layered in this order:

1. `appsettings.json`
2. `appsettings.{Environment}.json`
3. User secrets
4. Environment variables
5. Command-line arguments

Later providers override earlier values. For example, development loads both
`appsettings.json` and `appsettings.Development.json`; the development file
overrides matching base settings.

## Database behavior

Development uses `Data/auralogbook-dev.db` and has:

```json
"SeedUsersOnStartup": true
```

At API startup, migrations run first and users from
`AuraLogbook.Api/Data/users.json` are then validated, normalized, and upserted
into the development `Users` table.

Staging and production have startup seeding disabled. Their database connection
strings and secrets should be supplied through deployment configuration rather
than committed JSON files.

The API startup log reports the resolved environment and the active seeding
flag, making configuration selection visible in deployment logs.
