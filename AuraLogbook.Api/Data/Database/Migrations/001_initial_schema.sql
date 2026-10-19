CREATE TABLE IF NOT EXISTS Users (
    Id INTEGER PRIMARY KEY,
    Email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    PasswordHash TEXT NOT NULL,
    DisplayName TEXT,
    Birthday TEXT,
    ZodiacSign TEXT,
    AuraColor TEXT NOT NULL DEFAULT 'blue',
    AuraIntensity INTEGER NOT NULL DEFAULT 50 CHECK (AuraIntensity BETWEEN 0 AND 100),
    Avatar TEXT,
    Motto TEXT,
    SelectedPathway INTEGER NOT NULL DEFAULT 0,
    CreatedAt TEXT NOT NULL,
    UpdatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS MoodDefinitions (
    MoodKey TEXT PRIMARY KEY,
    DisplayName TEXT NOT NULL,
    IsActive INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS AuraColorDefinitions (
    AuraColorKey TEXT PRIMARY KEY,
    DisplayName TEXT NOT NULL,
    ChakraKey TEXT,
    Description TEXT NOT NULL,
    FOREIGN KEY (ChakraKey) REFERENCES ChakraDefinitions(ChakraKey)
);

CREATE TABLE IF NOT EXISTS ChakraDefinitions (
    ChakraKey TEXT PRIMARY KEY,
    DisplayName TEXT NOT NULL,
    Description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS SpiritualPathways (
    PathwayKey INTEGER PRIMARY KEY,
    DisplayName TEXT NOT NULL UNIQUE,
    Description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS MoodEntries (
    Id INTEGER PRIMARY KEY,
    UserId INTEGER NOT NULL,
    EntryDate TEXT NOT NULL,
    Comment TEXT,
    CreatedAt TEXT NOT NULL,
    UpdatedAt TEXT NOT NULL,
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS IX_MoodEntries_UserId_EntryDate
    ON MoodEntries(UserId, EntryDate DESC);

CREATE TABLE IF NOT EXISTS MoodEntryMoods (
    MoodEntryId INTEGER NOT NULL,
    MoodKey TEXT NOT NULL,
    PRIMARY KEY (MoodEntryId, MoodKey),
    FOREIGN KEY (MoodEntryId) REFERENCES MoodEntries(Id) ON DELETE CASCADE,
    FOREIGN KEY (MoodKey) REFERENCES MoodDefinitions(MoodKey)
);

CREATE TABLE IF NOT EXISTS ZodiacSigns (
    SignKey TEXT PRIMARY KEY,
    Description TEXT NOT NULL,
    Element TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS InsightTemplates (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    ZodiacSignKey TEXT NOT NULL,
    InsightType TEXT NOT NULL,
    Title TEXT NOT NULL,
    Message TEXT NOT NULL,
    FOREIGN KEY (ZodiacSignKey) REFERENCES ZodiacSigns(SignKey) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS IX_InsightTemplates_ZodiacSignKey
    ON InsightTemplates(ZodiacSignKey);
