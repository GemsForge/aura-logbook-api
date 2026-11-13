-- Shared typed pathway activity envelope for private practice and insight feedback records.
CREATE TABLE IF NOT EXISTS PathwayActivities (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    UserId INTEGER NOT NULL,
    Pathway TEXT NOT NULL CHECK (Pathway IN ('mindfulness', 'energy', 'faith')),
    ModuleKey TEXT NOT NULL,
    ActivityType TEXT NOT NULL,
    OccurredOn TEXT NOT NULL,
    ContentJson TEXT NOT NULL CHECK (json_valid(ContentJson)),
    CreatedAt TEXT NOT NULL,
    UpdatedAt TEXT NOT NULL,
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS IX_PathwayActivities_Owner_Pathway_Module_Type_Date
    ON PathwayActivities (UserId, Pathway, ModuleKey, ActivityType, OccurredOn DESC);
