# Pathway-aware mood-combination reflections

Aura Logbook can show an optional, pathway-aware reflection when a signed-in user selects two or three distinct moods. Curated reflections are used for exact mood-set matches; every other valid set receives a composed reflection based on the selected mood names and pathway. It is not a diagnosis, score, or replacement for the user’s own journal entry.

## Data and import

Curated source records live in `aura-ui/data/aura_logbook_mood_combinations.json`. Each record has a stable ID, two or three distinct mood names, and one non-empty interpretation for each supported pathway. The importer rejects duplicate IDs, duplicate mood sets, unknown moods, and incomplete pathway records. Mood order is normalized when the key is stored. The API composes a non-diagnostic pathway reflection when a valid set has no curated record, so new mood combinations do not display an empty state.

Migration `018_mood_combination_interpretations.sql` creates the lookup table. API startup applies migrations and then imports the curated reflections, so a fresh clone or an edited JSON needs only an API restart. The import is idempotent, touches no users or mood entries, and keeps existing rows if the source is invalid. Turn it off with `Database:ImportReflectionsOnStartup=false`. To refresh a database without restarting, run the reflection-only seed. It writes to the database selected by the API's Development connection string and never touches users or mood entries. From the repository root:

```bash
dotnet run --project Scripts/DatabaseSeeder/DatabaseSeeder.csproj -- --mode reflections
```

The seeder prints source combination, expected and stored interpretation counts, and a `reconciled`/`MISMATCH` status. It exits with `1` on a mismatch. See the [seeder README](../Scripts/DatabaseSeeder/README.md) for every argument and the full-import mode.

## API

`GET /api/mood-combinations/interpretation` requires a bearer token and accepts:

| Query parameter | Meaning |
|---|---|
| `moods` | Two or three comma-separated, distinct mood names. Order does not affect the match. |
| `pathwayKey` | The stored pathway enum: `0` Mindfulness, `1` Energy, or `2` Faith. |

The endpoint returns the authored interpretation when present, or a composed reflection for an otherwise valid mood set. Invalid pathway, mood, duplicate, or count values return `400 Bad Request`.

## UI behavior

The mood-entry form requests a reflection only when two or three moods are selected and a user is signed in. While data loads it shows a status message. Missing content is explained, and request errors offer a retry. Logging remains available if the endpoint fails. The panel uses the current primary theme surface and border tokens; user-authored reflection text remains independent.

## Combination hues (#345)

Migration `020_mood_combination_hues.sql` seeds `MoodCombinationHues` with one OKLCH hue, chroma factor and weight (default 1.25) per authored `MoodSetKey`; it is pathway-independent. The interpretation endpoint now also returns `hue` (null when none is authored), and the check-in reflection shows it as a small swatch beside the text. When a logged entry's distinct moods match a combination, the derived aura (`GET /api/aura/current`) uses that hue instead of the individual mood hues, and the "Why this color?" contributors name it, e.g. "Empowered + Tense on Wednesday". Unmatched combinations still blend their individual moods. Add a hue row whenever a new combination is authored; a test checks every source record has one.
