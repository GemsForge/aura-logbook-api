-- Preserve both levels of mood data while replacing the stale Users_legacy FK.
CREATE TEMP TABLE SavedMoodEntries AS SELECT * FROM MoodEntries;
CREATE TEMP TABLE SavedMoodEntryMoods AS SELECT * FROM MoodEntryMoods;
DROP TABLE MoodEntryMoods;
DROP TABLE MoodEntries;

CREATE TABLE MoodEntries (
    Id INTEGER PRIMARY KEY,
    UserId INTEGER NOT NULL,
    EntryDate TEXT NOT NULL,
    Comment TEXT,
    CreatedAt TEXT NOT NULL,
    UpdatedAt TEXT NOT NULL,
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);
CREATE INDEX IX_MoodEntries_UserId_EntryDate ON MoodEntries(UserId, EntryDate DESC);
CREATE TABLE MoodEntryMoods (
    MoodEntryId INTEGER NOT NULL,
    MoodKey TEXT NOT NULL,
    PRIMARY KEY (MoodEntryId, MoodKey),
    FOREIGN KEY (MoodEntryId) REFERENCES MoodEntries(Id) ON DELETE CASCADE,
    FOREIGN KEY (MoodKey) REFERENCES MoodDefinitions(MoodKey)
);
-- Copy only the columns owned by this migration. Later migrations add
-- WeatherSnapshotId and mood context columns to MoodEntries explicitly.
INSERT INTO MoodEntries (Id, UserId, EntryDate, Comment, CreatedAt, UpdatedAt)
SELECT Id, UserId, EntryDate, Comment, CreatedAt, UpdatedAt
FROM SavedMoodEntries;
INSERT INTO MoodEntryMoods (MoodEntryId, MoodKey)
SELECT MoodEntryId, MoodKey
FROM SavedMoodEntryMoods;
DROP TABLE SavedMoodEntryMoods;
DROP TABLE SavedMoodEntries;
