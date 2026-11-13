-- Preserve the optional invitation and response with its owner-scoped mood entry.
-- Existing entries remain unanswered; no historical response is inferred.
ALTER TABLE MoodEntries ADD COLUMN PathwayReflection TEXT
    CHECK (PathwayReflection IS NULL OR json_valid(PathwayReflection));
