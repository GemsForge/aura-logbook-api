# Database seeder

Imports the active JSON sources into the relational SQLite database. It applies
pending migrations from `AuraLogbook.Api/Data/Database/Migrations` first, so it
works on a new or existing database.

## Target database

Without `--database`, the seeder reads `Database:ConnectionString` from
`AuraLogbook.Api/appsettings.Development.json` and resolves a relative
`Data Source` against the API folder. That is the same file the API uses when
started with `dotnet run` in Development (`AuraLogbook.Api/Data/auralogbook-dev.db`).
The resolved path is printed at the start of every run.

## Modes

| Mode | What it changes |
|---|---|
| `full` (default) | Users, mood entries, mood pairs, reference data, zodiac insights, and curated mood-combination reflections. |
| `reflections` | Only `MoodCombinationInterpretations`. Users, mood entries, and other legacy data are never inserted, updated, or deleted. |

### Reflection-only seed (recommended for reflection content)

From the repository root:

```bash
dotnet run --project Scripts/DatabaseSeeder/DatabaseSeeder.csproj -- --mode reflections
```

The import replaces all curated reflection rows with the source in one
transaction, so re-running it is idempotent. It then compares every stored
combination/pathway row with the source and prints:

```text
Reflections: 15 combinations, 45 expected / 45 stored pathway interpretations, 0 mismatches. Status: reconciled.
```

The run exits with `1` and writes a `MISMATCH` line to stderr if the stored
rows do not match the source. The JSON report defaults to
`AuraLogbook.Api/Data/reflection-seed-report.json`.

### Full seed

```bash
dotnet run --project Scripts/DatabaseSeeder/DatabaseSeeder.csproj -- \
  --input AuraLogbook.Api/Data/users.json \
  --moods AuraLogbook.Api/Data/moods.json \
  --zodiac AuraLogbook.Api/Data/zodiacInsights.json
```

It validates required user fields, converts legacy timestamps to UTC ISO-8601,
converts the legacy `0–500` aura intensity scale to `0–100`, and upserts users by
email. A user validation failure rolls the user import back. The report
(`AuraLogbook.Api/Data/seed-reconciliation.json` by default) compares source and
stored counts and includes the reflection reconciliation. The run exits with `1`
if reflections do not reconcile.

## Arguments

```text
--mode          full (default) or reflections.
--database      SQLite file path. Overrides the Development connection string.
--appsettings   API settings file used to find the database
                (default AuraLogbook.Api/appsettings.Development.json).
--migration     Migration directory (default AuraLogbook.Api/Data/Database/Migrations).
--combinations  Curated reflection source
                (default aura-ui/data/aura_logbook_mood_combinations.json).
--input         User JSON source (full mode only).
--moods         Mood-entry JSON source (full mode only).
--zodiac        Zodiac-insight JSON source (full mode only).
--report        Output path for the JSON report.
```

Source JSON files are never modified.

## How the pieces relate

- `aura-ui/data/aura_logbook_mood_combinations.json` is the editable authoring
  source for curated reflections.
- Migration `018_mood_combination_interpretations.sql` creates the lookup table.
  Migration `006` seeds the pathway rows it references.
- API startup applies migrations, then imports the curated reflections from the
  copy of the JSON shipped with the API build (`Database:ImportReflectionsOnStartup`,
  on by default). An invalid or missing source is logged and existing rows are kept.
- This seeder (`MoodCombinationImporter`) copies the authored JSON into SQLite.
- At runtime, `GET /api/mood-combinations/interpretation` reads the SQLite rows
  through `SqliteMoodCombinationRepository`. If no row matches, it composes a
  fallback reflection, so a missing seed shows generic text rather than an error.
  Restarting the API picks up JSON edits; use `--mode reflections` to refresh a
  database without restarting, or to see the reconciliation report.

Production storage is never seeded automatically.
