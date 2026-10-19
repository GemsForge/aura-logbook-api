# Aura Logbook relational ERD

```mermaid
erDiagram
    Users ||--o{ MoodEntries : records
    MoodEntries ||--o{ MoodEntryMoods : has
    MoodDefinitions ||--o{ MoodEntryMoods : classifies
    MoodDefinitions ||--o{ MoodAuraMappings : maps
    AuraColorDefinitions ||--o{ MoodAuraMappings : maps
    ChakraDefinitions ||--o{ AuraColorDefinitions : aligns
    ZodiacSigns ||--o{ InsightTemplates : provides

    Users {
        int Id PK
        string Email UK
        string PasswordHash
        string DisplayName
        date Birthday
        string ZodiacSign
        string AuraColor
        int AuraIntensity
        int SelectedPathway
        datetime CreatedAt
        datetime UpdatedAt
    }

    MoodDefinitions {
        string MoodKey PK
        string DisplayName
        bool IsActive
    }

    MoodEntries {
        int Id PK
        int UserId FK
        date EntryDate
        string Comment
        datetime CreatedAt
        datetime UpdatedAt
    }

    MoodEntryMoods {
        int MoodEntryId PK, FK
        string MoodKey PK, FK
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

    MoodAuraMappings {
        string MoodKey PK, FK
        string AuraColorKey PK, FK
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
```

The UI shade palette remains presentation-only. `BaseHex` stores the canonical
MUI 500 value used by the reference data; the UI continues to derive intensity
shades from its existing palette.
