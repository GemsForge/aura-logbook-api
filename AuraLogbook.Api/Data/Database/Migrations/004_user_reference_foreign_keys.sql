ALTER TABLE Users RENAME TO Users_legacy;

CREATE TABLE Users (
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
    UpdatedAt TEXT NOT NULL,
    FOREIGN KEY (AuraColor) REFERENCES AuraColorDefinitions(AuraColorKey),
    FOREIGN KEY (ZodiacSign) REFERENCES ZodiacSigns(SignKey),
    FOREIGN KEY (SelectedPathway) REFERENCES SpiritualPathways(PathwayKey)
);

INSERT INTO Users
    (Id, Email, PasswordHash, DisplayName, Birthday, ZodiacSign, AuraColor,
     AuraIntensity, Avatar, Motto, SelectedPathway, CreatedAt, UpdatedAt)
SELECT
    Id, Email, PasswordHash, DisplayName, Birthday, ZodiacSign, AuraColor,
    AuraIntensity, Avatar, Motto, SelectedPathway, CreatedAt, UpdatedAt
FROM Users_legacy;

DROP TABLE Users_legacy;

CREATE INDEX IF NOT EXISTS IX_MoodEntries_UserId_EntryDate
    ON MoodEntries(UserId, EntryDate DESC);
