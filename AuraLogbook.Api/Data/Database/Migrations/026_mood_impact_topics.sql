-- Mood-entry context is selected by the user and is never treated as a cause of mood.
-- Historic entries receive an empty list; no context is inferred for existing records.
ALTER TABLE MoodEntries ADD COLUMN ImpactTopics TEXT NOT NULL DEFAULT '[]';
