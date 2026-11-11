# Database-driven reference data

Aura's editable definitions and presentation values are seeded by ordered SQL migrations and served from `GET /api/reference-data`. The API and UI types describe the response shape; SQLite rows define the active keys, labels, descriptions, palettes, moods, pathways, tokens, and graphic metadata.

## Updating definitions

1. Add a new numbered SQL migration under `AuraLogbook.Api/Data/Database/Migrations/` for each change. Do not edit a migration that has already shipped because installed databases record its filename as applied.
2. Keep existing keys stable when changing labels, descriptions, ordering, colors, or icons. Use `IsActive = 0` to retire a choice while preserving historical records.
3. If a key must change, add an explicit migration that translates persisted references and compatibility payloads. Pathway client keys are `mindfulness`, `energy`, and `faith`; their SQLite integer IDs remain stable foreign keys.
4. Add color shades in `AuraColorShades`, global visual values in `ThemeTokens`, and graphic paths plus alternative text in `GraphicAssets`. Keep image binaries on the existing static asset host.
5. Verify the combined endpoint's ordering and values, active-key validation, migration behavior against an existing database, and the compatibility endpoints before release.

The older `/api/reference-data/auras`, `/chakras`, `/pathways`, and `/mood-aura-mappings` routes remain available for clients that have not moved to the combined response. New UI code should consume `GET /api/reference-data` so it does not maintain duplicate definitions.

## Compatibility

User records retain their existing pathway foreign keys. Migration 010 adds stable pathway keys and the API translates between those keys and the stored IDs. JSON user data can still be read with the legacy numeric pathway values, while API responses emit stable string keys. Existing aura and mood keys are also retained; old mood entries therefore remain readable even if a mood is later retired from selection.
