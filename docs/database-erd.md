# Aura Logbook relational ERD

This diagram reflects the schema produced by the current SQL migrations under `AuraLogbook.Api/Data/Database/Migrations/`. Development and FIT/Staging use this SQLite schema. Some tables are schema foundations for features that are not yet complete in the UI; a table's presence is not evidence that its end-user experience is finished.

```mermaid
erDiagram
    SpiritualPathways ||--o{ Users : selected_by
    AuraColorDefinitions ||--o{ Users : preferred_by
    ZodiacSigns ||--o{ Users : describes
    Users ||--o{ MoodEntries : records
    Users ||--o{ ReflectionResponses : writes
    Users ||--o{ WeeklyAuraSummaries : owns

    MoodEntries ||--o{ MoodEntryMoods : has
    MoodDefinitions ||--o{ MoodEntryMoods : classifies
    MoodDefinitions ||--o{ MoodAuraMappings : maps
    AuraColorDefinitions ||--o{ MoodAuraMappings : maps

    ChakraDefinitions ||--o{ AuraColorDefinitions : aligns
    ChakraDefinitions o|--o{ MoodEntries : contextualizes
    WeatherSnapshots o|--o{ MoodEntries : contextualizes

    ZodiacSigns ||--o{ InsightTemplates : provides

    SpiritualPathways o|--o{ ReflectionPrompts : targets
    AuraColorDefinitions o|--o{ ReflectionPrompts : targets
    ChakraDefinitions o|--o{ ReflectionPrompts : targets
    ReflectionPrompts ||--o{ ReflectionResponses : receives
    MoodEntries ||--o{ ReflectionResponses : includes

    AuraColorDefinitions o|--o{ WeeklyAuraSummaries : dominates
    ChakraDefinitions o|--o{ WeeklyAuraSummaries : dominates

    Users {
        int Id PK
        string Email UK
        string PasswordHash
        string DisplayName
        date Birthday
        string ZodiacSign FK
        string AuraColor
        int AuraIntensity
        string Avatar
        string Motto
        int SelectedPathway FK
        datetime CreatedAt
        datetime UpdatedAt
    }

    MoodEntries {
        int Id PK
        int UserId FK
        date EntryDate
        string Comment
        int WeatherSnapshotId FK
        string AuraColor FK
        int AuraIntensity
        string ChakraKey FK
        string WeatherSnapshot
        datetime CreatedAt
        datetime UpdatedAt
    }

    MoodEntryMoods {
        int MoodEntryId PK,FK
        string MoodKey PK,FK
    }

    MoodDefinitions {
        string MoodKey PK
        string DisplayName
        bool IsActive
    }

    MoodAuraMappings {
        string MoodKey PK,FK
        string AuraColorKey PK,FK
    }

    AuraColorDefinitions {
        string AuraColorKey PK
        string DisplayName
        string BaseHex
        string ChakraKey FK
        string Description
        bool IsNeutral
        bool IsActive
    }

    ChakraDefinitions {
        string ChakraKey PK
        string DisplayName
        string Description
    }

    SpiritualPathways {
        int PathwayKey PK
        string DisplayName UK
        string Description
    }

    ZodiacSigns {
        string SignKey PK
        string Description
        string Element
    }

    InsightTemplates {
        int Id PK
        string ZodiacSignKey FK
        string InsightType
        string Title
        string Message
    }

    ReflectionPrompts {
        int Id PK
        string PromptKey UK
        string PromptText
        string Category
        int PathwayKey FK
        string AuraColorKey FK
        string ChakraKey FK
        bool IsActive
        datetime CreatedAt
        datetime UpdatedAt
    }

    ReflectionResponses {
        int Id PK
        int UserId FK
        int PromptId FK
        int MoodEntryId FK
        string ResponseText
        datetime CreatedAt
        datetime UpdatedAt
    }

    WeatherSnapshots {
        int Id PK
        string Location
        datetime ObservedAt
        string Condition
        decimal Temperature
        string TemperatureUnit
        datetime CreatedAt
    }

    WeeklyAuraSummaries {
        int Id PK
        int UserId FK
        date WeekStartDate
        date WeekEndDate
        int EntryCount
        string DominantAuraColorKey FK
        string DominantChakraKey FK
        decimal AverageAuraIntensity
        string ReflectiveSummary
        datetime GeneratedAt
    }
```

## Current boundaries

- `BaseHex` is canonical reference data; the UI can derive accessible presentation shades from it.
- `MoodEntries.WeatherSnapshotId` references the normalized weather table. `MoodEntries.WeatherSnapshot` is a later text context field and should not be assumed to contain the same shape.
- `MoodEntries.AuraColor` is currently contextual text rather than a declared foreign key; validate it at the application boundary until a forward migration adds a database constraint.
- Reflection responses are owned by a user and tied to both a prompt and one of that user's mood entries. The API enforces that ownership relationship.
- Weekly summaries are unique by the composite `(UserId, WeekStartDate)` key.
- Weekly aura summary and weather snapshot tables exist in migrations, but their complete generation, persistence, and UI journeys must be verified separately before being described as shipped features.
- Migration history is authoritative. Do not edit an already-applied migration to make this diagram match; add a reviewed forward migration and update the diagram.
