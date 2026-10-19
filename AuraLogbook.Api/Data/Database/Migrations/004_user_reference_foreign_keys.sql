INSERT OR IGNORE INTO ChakraDefinitions (ChakraKey, DisplayName, Description) VALUES
    ('root', 'Root', 'Grounding, stability, and belonging.'),
    ('sacral', 'Sacral', 'Creativity, emotion, and connection.'),
    ('solar-plexus', 'Solar Plexus', 'Confidence, agency, and personal power.'),
    ('heart', 'Heart', 'Compassion, balance, and love.'),
    ('throat', 'Throat', 'Expression, truth, and communication.'),
    ('third-eye', 'Third Eye', 'Intuition, insight, and perspective.'),
    ('crown', 'Crown', 'Meaning, awareness, and spiritual connection.');

INSERT OR IGNORE INTO AuraColorDefinitions
    (AuraColorKey, DisplayName, ChakraKey, Description)
VALUES
    ('red', 'Red', 'root', 'Grounded and vital.'),
    ('orange', 'Orange', 'sacral', 'Creative and expressive.'),
    ('yellow', 'Yellow', 'solar-plexus', 'Confident and empowered.'),
    ('green', 'Green', 'heart', 'Balanced and compassionate.'),
    ('blue', 'Blue', 'throat', 'Clear and communicative.'),
    ('indigo', 'Indigo', 'third-eye', 'Intuitive and insightful.'),
    ('violet', 'Violet', 'crown', 'Reflective and connected.'),
    ('gray', 'Gray', NULL, 'Neutral and restorative.'),
    ('pink', 'Pink', 'heart', 'Warm and nurturing.');

INSERT OR IGNORE INTO SpiritualPathways (PathwayKey, DisplayName, Description)
VALUES (0, 'Unspecified', 'No pathway selected.');

INSERT OR IGNORE INTO ZodiacSigns (SignKey, Description, Element) VALUES
    ('aries', 'Courageous and initiating.', 'fire'),
    ('taurus', 'Steady and grounded.', 'earth'),
    ('gemini', 'Curious and adaptable.', 'air'),
    ('cancer', 'Caring and intuitive.', 'water'),
    ('leo', 'Expressive and generous.', 'fire'),
    ('virgo', 'Thoughtful and discerning.', 'earth'),
    ('libra', 'Harmonious and relational.', 'air'),
    ('scorpio', 'Focused and transformative.', 'water'),
    ('sagittarius', 'Adventurous and optimistic.', 'fire'),
    ('capricorn', 'Disciplined and purposeful.', 'earth'),
    ('aquarius', 'Original and visionary.', 'air'),
    ('pisces', 'Imaginative and empathetic.', 'water');

UPDATE Users SET ZodiacSign = lower(ZodiacSign)
WHERE ZodiacSign IS NOT NULL;

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
