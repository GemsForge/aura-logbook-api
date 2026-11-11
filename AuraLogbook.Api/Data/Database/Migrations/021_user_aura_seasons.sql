-- #346: history of named aura seasons per user. A season is open while EndedOn is NULL;
-- at most one open season per user.
CREATE TABLE IF NOT EXISTS UserAuraSeasons (
    Id INTEGER PRIMARY KEY,
    UserId INTEGER NOT NULL REFERENCES Users(Id) ON DELETE CASCADE,
    SeasonKey TEXT NOT NULL,
    StartedOn TEXT NOT NULL,
    EndedOn TEXT,
    CHECK (EndedOn IS NULL OR EndedOn >= StartedOn)
);

CREATE INDEX IF NOT EXISTS IX_UserAuraSeasons_User ON UserAuraSeasons(UserId, StartedOn);
CREATE UNIQUE INDEX IF NOT EXISTS UX_UserAuraSeasons_Open ON UserAuraSeasons(UserId) WHERE EndedOn IS NULL;
