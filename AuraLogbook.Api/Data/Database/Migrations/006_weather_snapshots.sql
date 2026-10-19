CREATE TABLE IF NOT EXISTS WeatherSnapshots (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Location TEXT NOT NULL CHECK (length(trim(Location)) > 0),
    ObservedAt TEXT NOT NULL,
    Condition TEXT NOT NULL CHECK (length(trim(Condition)) > 0),
    Temperature REAL NOT NULL,
    TemperatureUnit TEXT NOT NULL DEFAULT 'F' CHECK (TemperatureUnit IN ('C', 'F')),
    CreatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE MoodEntries
    ADD COLUMN WeatherSnapshotId INTEGER
    REFERENCES WeatherSnapshots(Id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS IX_MoodEntries_WeatherSnapshotId
    ON MoodEntries(WeatherSnapshotId);
