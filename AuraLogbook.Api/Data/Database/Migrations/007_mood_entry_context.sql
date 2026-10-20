ALTER TABLE MoodEntries ADD COLUMN AuraColor TEXT;
ALTER TABLE MoodEntries ADD COLUMN AuraIntensity INTEGER CHECK (AuraIntensity BETWEEN 0 AND 100);
ALTER TABLE MoodEntries ADD COLUMN ChakraKey TEXT REFERENCES ChakraDefinitions(ChakraKey);
ALTER TABLE MoodEntries ADD COLUMN WeatherSnapshot TEXT;

CREATE INDEX IF NOT EXISTS IX_MoodEntries_UserId_EntryDate
    ON MoodEntries(UserId, EntryDate DESC);
