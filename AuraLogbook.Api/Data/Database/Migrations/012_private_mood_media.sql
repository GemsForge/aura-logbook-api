-- Metadata is relational; media bytes remain in private file storage.
-- No MoodEntries FK is declared because Production currently stores moods in JSON files.
CREATE TABLE IF NOT EXISTS MoodMediaAttachments (
    Id TEXT NOT NULL PRIMARY KEY,
    UserId INTEGER NOT NULL,
    MoodEntryId INTEGER NOT NULL,
    StorageKey TEXT NOT NULL UNIQUE,
    FileName TEXT NOT NULL,
    ContentType TEXT NOT NULL CHECK (ContentType IN ('image/jpeg', 'image/png', 'image/webp')),
    ByteLength INTEGER NOT NULL CHECK (ByteLength > 0 AND ByteLength <= 10485760),
    CreatedAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS IX_MoodMediaAttachments_User_Mood_Created
    ON MoodMediaAttachments (UserId, MoodEntryId, CreatedAt);
