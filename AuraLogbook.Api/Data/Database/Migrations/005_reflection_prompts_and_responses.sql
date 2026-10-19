CREATE TABLE IF NOT EXISTS ReflectionPrompts (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    PromptKey TEXT NOT NULL UNIQUE,
    PromptText TEXT NOT NULL CHECK (length(trim(PromptText)) > 0),
    Category TEXT NOT NULL CHECK (length(trim(Category)) > 0),
    PathwayKey INTEGER,
    AuraColorKey TEXT COLLATE NOCASE,
    ChakraKey TEXT COLLATE NOCASE,
    IsActive INTEGER NOT NULL DEFAULT 1 CHECK (IsActive IN (0, 1)),
    CreatedAt TEXT NOT NULL,
    UpdatedAt TEXT NOT NULL,
    FOREIGN KEY (PathwayKey) REFERENCES SpiritualPathways(PathwayKey) ON DELETE SET NULL,
    FOREIGN KEY (AuraColorKey) REFERENCES AuraColorDefinitions(AuraColorKey) ON DELETE SET NULL,
    FOREIGN KEY (ChakraKey) REFERENCES ChakraDefinitions(ChakraKey) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS IX_ReflectionPrompts_ActivePathwayAuraChakra
    ON ReflectionPrompts(IsActive, PathwayKey, AuraColorKey, ChakraKey);

CREATE TABLE IF NOT EXISTS ReflectionResponses (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    UserId INTEGER NOT NULL,
    PromptId INTEGER NOT NULL,
    MoodEntryId INTEGER NOT NULL,
    ResponseText TEXT NOT NULL CHECK (length(trim(ResponseText)) > 0),
    CreatedAt TEXT NOT NULL,
    UpdatedAt TEXT NOT NULL,
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    FOREIGN KEY (PromptId) REFERENCES ReflectionPrompts(Id) ON DELETE RESTRICT,
    FOREIGN KEY (MoodEntryId) REFERENCES MoodEntries(Id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS IX_ReflectionResponses_UserEntryCreated
    ON ReflectionResponses(UserId, MoodEntryId, CreatedAt DESC);

CREATE INDEX IF NOT EXISTS IX_ReflectionResponses_PromptId
    ON ReflectionResponses(PromptId);
