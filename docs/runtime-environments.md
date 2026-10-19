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

## Database migration workflow

The API applies every `*.sql` file in
`AuraLogbook.Api/Data/Database/Migrations/` in filename order at startup. The
`__SchemaMigrations` table records applied filenames, so restarting the API is
safe and does not reapply completed migrations.

To create a clean development database, remove only the local development
database file and start the API with `Development`. The API creates the SQLite
file, enables foreign keys, applies migrations, and then imports users when
`SeedUsersOnStartup` is enabled.

The migration source is also copied by the test project, allowing migration
tests to run against an isolated temporary SQLite database without using a
developer database file.

## Existing-data import workflow

For a complete import of the active JSON sources, run the dedicated seeder:

```bash
dotnet run --project Scripts/DatabaseSeeder/DatabaseSeeder.csproj -- \
  --input AuraLogbook.Api/Data/users.json \
  --moods AuraLogbook.Api/Data/moods.json \
  --zodiac AuraLogbook.Api/Data/zodiacInsights.json \
  --database AuraLogbook.Api/Data/auralogbook-dev.db \
  --report AuraLogbook.Api/Data/seed-reconciliation.json
```

The import validates and normalizes legacy records, preserves ownership and
profile data, upserts users by email, imports mood pairs and insight templates,
and writes source-versus-database counts to the reconciliation report. It does
not modify the source JSON files. A validation failure rolls back the
transaction.

The API startup seeder is intentionally narrower: it upserts users from
`users.json` for local Development startup. Use the dedicated seeder when
rebuilding all active relational data.
