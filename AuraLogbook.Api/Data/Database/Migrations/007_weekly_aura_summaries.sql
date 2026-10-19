CREATE TABLE IF NOT EXISTS WeeklyAuraSummaries (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    UserId INTEGER NOT NULL,
    WeekStartDate TEXT NOT NULL CHECK (date(WeekStartDate) IS NOT NULL),
    WeekEndDate TEXT NOT NULL CHECK (
        date(WeekEndDate) IS NOT NULL
        AND date(WeekEndDate) >= date(WeekStartDate)
    ),
    EntryCount INTEGER NOT NULL CHECK (EntryCount >= 0),
    DominantAuraColorKey TEXT,
    DominantChakraKey TEXT,
    AverageAuraIntensity REAL CHECK (
        AverageAuraIntensity IS NULL
        OR AverageAuraIntensity BETWEEN 0 AND 100
    ),
    ReflectiveSummary TEXT,
    GeneratedAt TEXT,
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    FOREIGN KEY (DominantAuraColorKey) REFERENCES AuraColorDefinitions(AuraColorKey) ON DELETE RESTRICT,
    FOREIGN KEY (DominantChakraKey) REFERENCES ChakraDefinitions(ChakraKey) ON DELETE RESTRICT,
    UNIQUE (UserId, WeekStartDate)
);
