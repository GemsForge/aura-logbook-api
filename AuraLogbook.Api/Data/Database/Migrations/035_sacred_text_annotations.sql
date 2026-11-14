-- Private, version-bound reading annotations and bookmarks for the embedded sacred-text reader.
CREATE TABLE IF NOT EXISTS SacredTextAnnotations (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    UserId INTEGER NOT NULL,
    Framework TEXT NOT NULL CHECK (Framework IN ('christian', 'muslim', 'jewish')),
    SectionReference TEXT NOT NULL CHECK (length(SectionReference) BETWEEN 1 AND 120),
    SourceVersion TEXT NOT NULL CHECK (length(SourceVersion) BETWEEN 1 AND 180),
    Language TEXT NOT NULL CHECK (length(Language) BETWEEN 2 AND 16),
    Kind TEXT NOT NULL CHECK (Kind IN ('highlight', 'note', 'bookmark')),
    StartOffset INTEGER NOT NULL CHECK (StartOffset >= 0),
    EndOffset INTEGER NOT NULL CHECK (EndOffset >= StartOffset),
    SegmentReference TEXT NULL CHECK (SegmentReference IS NULL OR length(SegmentReference) <= 120),
    AnchorHash TEXT NULL CHECK (AnchorHash IS NULL OR length(AnchorHash) = 64),
    Note TEXT NULL CHECK (Note IS NULL OR length(Note) <= 2000),
    CreatedAt TEXT NOT NULL,
    UpdatedAt TEXT NOT NULL,
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS IX_SacredTextAnnotations_Owner_Framework_Section
    ON SacredTextAnnotations (UserId, Framework, SectionReference, SourceVersion, Kind);
