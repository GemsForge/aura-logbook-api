# User database seeder

This utility seeds the relational `Users` table from the active JSON source:

`AuraLogbook.Api/Data/users.json`

It creates the initial schema if necessary, validates required fields, converts
legacy timestamps to UTC ISO-8601 values, converts the legacy `0–500` aura
intensity scale to the database `0–100` scale, and upserts by email.

From the repository root:

```bash
dotnet run --project Scripts/DatabaseSeeder/DatabaseSeeder.csproj -- \
  --input AuraLogbook.Api/Data/users.json \
  --database AuraLogbook.Api/Data/auralogbook-dev.db
```

Optional arguments:

```text
--input      Path to the JSON user source.
--database   SQLite database path.
--migration  Path to the initial schema migration.
--moods      Path to the JSON mood-entry source.
--zodiac     Path to the JSON zodiac-insight source.
--report     Output path for the reconciliation report.
```

The import is transactional: if any record fails validation, no user records
are committed. The source JSON file is never modified.

The default reconciliation report is written to
`AuraLogbook.Api/Data/seed-reconciliation.json` and compares source counts with
stored users, mood entries, mood pairs, zodiac signs, and insight templates.
