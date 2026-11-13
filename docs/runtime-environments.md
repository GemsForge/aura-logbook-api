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
than committed JSON files. Every environment, including Production, uses the
SQLite repositories for users, moods, and zodiac insights (#353); the JSON
files are import and audit sources only. Production refuses to start unless
`Database:ConnectionString` names its own durable SQLite file (not in-memory and
not `auralogbook-dev.db`). See [Production cutover](#production-cutover-from-json-files)
before switching an existing Production deployment.

The API startup log reports the resolved environment and the active seeding
flag, making configuration selection visible in deployment logs.

## Password recovery

Recovery links expire after 30 minutes by default and can be used once. The API
stores only the token hash. The request endpoint returns the same confirmation
for registered and unregistered email addresses; excess requests are throttled
per email and per client IP.

Both recovery endpoints return 404 unless all of these hold:

- `PasswordReset:Enabled` is `true`;
- an email sender is registered: Development always uses the log-based sender,
  and Staging/Production use SMTP only when `Email:Smtp:Host` and
  `Email:Smtp:FromAddress` are set;
- `PasswordReset:ResetUrlBase` is an absolute http(s) URL of the UI's
  `/reset-password` page.

| Environment | Sender | `ResetUrlBase` |
| --- | --- | --- |
| Development | Log (copy link from API log) | `http://localhost:58407/reset-password` (Vite uses `strictPort`) |
| Staging | SMTP | `https://<staging-ui-host>/reset-password` |
| Production | SMTP | `https://<production-ui-host>/reset-password` |

To enable recovery in a deployed environment, set on the API host:

```text
PasswordReset__Enabled=true
PasswordReset__ResetUrlBase=https://<ui-host>/reset-password
Email__Smtp__Host=<smtp relay host>
Email__Smtp__Port=587
Email__Smtp__FromAddress=no-reply@<verified domain>
Email__Smtp__Username=<secret>
Email__Smtp__Password=<secret>
```

and build the UI with `VITE_PASSWORD_RESET_ENABLED=true` so the "Forgot
password?" link and routes appear. Keep the two flags in step. The sending
domain must publish SPF and DKIM records for the chosen relay, or mail may land
in spam.

Outside Development the API never logs reset tokens or links. If the SMTP relay
fails, the user still gets the generic confirmation and the API logs only the
error type. Production users and reset tokens now share the SQLite database
(#353).

FIT/Staging deployments should provide their own `Database:ConnectionString`
through deployment configuration. The database health diagnostic is available
at `GET /health/database` and reports the resolved environment and applied
migration count without exposing connection details.

To reset only the staging database, use an explicit FIT environment and
confirmation flag:

```bash
AURA_ENV=FIT node Scripts/reset-staging-db.mjs --confirm
```

The reset script defaults to `Data/auralogbook-staging.db` and can only target a
path supplied through `AURA_STAGING_DATABASE`. It refuses to run without
`AURA_ENV=FIT` and `--confirm`. Start the API with FIT afterward to recreate the
schema through the migration runner. Staging credentials and storage ownership
remain deployment responsibilities and are never committed to the repository.

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

See [Database migration recovery](database-recovery.md) for backup, failed
migration, and restore guidance. The migrator is forward-only; it does not
provide automatic rollback scripts.

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

## Production cutover from JSON files

Production now reads and writes users, moods, and zodiac insights only through
SQLite. A deployment that still has JSON-backed data needs a one-time,
operator-approved cutover. Nothing below runs automatically, and no live data
is changed by the code. Do every step on copies first.

**Storage requirements**

- `Database__ConnectionString=Data Source=/<persistent-volume>/auralogbook.db`.
  The file must live on a volume that survives restarts and redeploys. SQLite
  allows one writer, so run a single API instance against it.
- `Storage__PrivateMediaPath` on the same persistent volume, outside any
  static web root. Private mood photos are bytes on disk plus metadata rows in
  SQLite; both must be backed up together.

**1. Inventory and back up**

1. Stop writes (maintenance window or stop the API).
2. Copy the live `users.json`, `moods.json`, and `zodiacInsights.json`, plus the
   private media folder, to a dated backup location. Keep them unchanged; they
   are the rollback source.
3. If a SQLite file already exists, back it up as described in
   [Database migration recovery](database-recovery.md).

**2. Rehearse the import on a copy**

```bash
dotnet run --project Scripts/DatabaseSeeder/DatabaseSeeder.csproj -- \
  --input /backup/users.json --moods /backup/moods.json --zodiac /backup/zodiacInsights.json \
  --database /tmp/aura-cutover-rehearsal.db --report /tmp/aura-cutover-report.json
```

The seeder applies migrations, validates every user (an invalid record aborts
the user import with no rows committed), keeps mood ownership by mapping legacy
user IDs to stored IDs, upserts by email, and writes source-versus-stored
counts. It exits non-zero if curated reflections do not reconcile.

**3. Verify before cutover**

- Report counts: source users and moods equal stored users and mood entries
  (duplicate emails collapse to one user; investigate any difference).
- `sqlite3 /tmp/aura-cutover-rehearsal.db "PRAGMA foreign_key_check;"` returns
  no rows.
- Start the API against the rehearsal file, sign in as a known account, and
  confirm its entries and photos appear.

**4. Cut over (requires explicit approval)**

Run the same seeder command against the Production database path, re-check the
counts, then start the new API version with the durable connection string.

**5. Roll back**

Stop the API, redeploy the previous version, and restore the backed-up JSON
files and media folder. Keep the SQLite file for diagnosis instead of deleting
it.

