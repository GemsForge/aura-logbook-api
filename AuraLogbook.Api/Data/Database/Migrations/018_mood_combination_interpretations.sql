CREATE TABLE IF NOT EXISTS MoodCombinationInterpretations (
    CombinationId TEXT NOT NULL,
    MoodSetKey TEXT NOT NULL,
    MoodsJson TEXT NOT NULL,
    PathwayKey INTEGER NOT NULL,
    Interpretation TEXT NOT NULL,
    IsActive INTEGER NOT NULL DEFAULT 1 CHECK (IsActive IN (0, 1)),
    PRIMARY KEY (CombinationId, PathwayKey),
    UNIQUE (MoodSetKey, PathwayKey),
    FOREIGN KEY (PathwayKey) REFERENCES SpiritualPathways(PathwayKey) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS IX_MoodCombinationInterpretations_Lookup
    ON MoodCombinationInterpretations(MoodSetKey, PathwayKey, IsActive);
